import { NextResponse, type NextRequest } from "next/server";
import { apiError, assertSameOrigin, parseJson } from "@/lib/api/http";
import { dailyResponseSchema } from "@/lib/api/schemas";
import {
  applyMutation,
  createDailyResult,
  isValidMutationToken,
  mutationLabel,
} from "@/lib/domain/engine";
import { DAILY_QUESTIONS } from "@/lib/domain/questions";
import type { Mutation, MutationSlot, TraitKey, Traits } from "@/lib/domain/types";
import { generateAiFlavor } from "@/lib/server/llm";
import { ApiError, requireUser } from "@/lib/supabase/auth";
import { avatarFromRow } from "@/lib/supabase/mappers";
import { assertQuery } from "@/lib/supabase/query";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = await parseJson(request, dailyResponseSchema);
    const { user, supabase } = await requireUser(request);
    const { data: avatarRow, error: avatarError } = await supabase.from("avatars").select("*").eq("owner_id", user.id).maybeSingle();
    assertQuery(avatarError);
    if (!avatarRow) throw new ApiError(404, "分身不存在");
    const avatar = avatarFromRow(avatarRow);

    const { data: existing, error: existingError } = await supabase.from("daily_entries").select("*").eq("avatar_id", avatar.id).eq("local_date", input.date).maybeSingle();
    assertQuery(existingError);
    if (existing) return NextResponse.json({ idempotent: true, entry: existing });

    const { data: prompt, error: promptError } = await supabase.from("daily_prompts").select("*").eq("avatar_id", avatar.id).eq("local_date", input.date).maybeSingle();
    assertQuery(promptError);
    if (!prompt || prompt.question_id !== input.questionId) throw new ApiError(409, "今日问题不匹配");
    const question = DAILY_QUESTIONS.find((item) => item.id === input.questionId);
    if (!question) throw new ApiError(400, "未知问题");

    const result = createDailyResult({ avatar, question, answer: input.answer, date: input.date });
    const aiFlavor = await generateAiFlavor({ avatar, question, answer: input.answer });
    if (aiFlavor) {
      const traits: Traits = { ...avatar.traits };
      for (const [key, delta] of Object.entries(aiFlavor.traitDelta) as Array<[TraitKey, number]>) {
        traits[key] = clamp(traits[key] + delta);
      }
      let mutation = result.entry.mutation;
      const slot = aiFlavor.mutationSlot as MutationSlot;
      if (isValidMutationToken(slot, aiFlavor.mutationToken)) {
        mutation = {
          ...mutation,
          slot,
          token: aiFlavor.mutationToken,
          label: mutationLabel(aiFlavor.mutationToken),
          previousToken: slot === "texture" ? null : avatar.parts[slot],
        } satisfies Mutation;
      }
      result.avatar = applyMutation({ ...avatar, traits }, mutation);
      result.entry = {
        ...result.entry,
        response: aiFlavor.responseText,
        traitDelta: aiFlavor.traitDelta,
        mutation,
        sticker: { ...result.entry.sticker, title: aiFlavor.stickerTitle, subtitle: mutation.label },
      };
    }

    const { error: rpcError } = await supabase.rpc("submit_daily_result", {
      p_owner_id: user.id,
      p_avatar_id: avatar.id,
      p_entry: { ...result.entry, timezone: input.timezone },
      p_avatar_traits: result.avatar.traits,
      p_avatar_parts: result.avatar.parts,
      p_mutation_count: result.avatar.mutationCount,
      p_mutation: result.entry.mutation,
      p_sticker: result.entry.sticker,
    });
    assertQuery(rpcError, "保存今日变化失败");
    await supabase.from("product_events").insert({ user_id: user.id, event_name: "daily_answer_submitted", properties: { questionId: question.id } });
    return NextResponse.json({ avatar: result.avatar, entry: result.entry, source: aiFlavor ? "ai" : "rules" });
  } catch (error) {
    return apiError(error);
  }
}
