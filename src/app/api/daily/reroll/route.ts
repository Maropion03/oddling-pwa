import { NextResponse, type NextRequest } from "next/server";
import { apiError, assertSameOrigin, parseJson } from "@/lib/api/http";
import { rerollSchema } from "@/lib/api/schemas";
import { selectDailyQuestion } from "@/lib/domain/engine";
import { ApiError, requireUser } from "@/lib/supabase/auth";
import { assertQuery } from "@/lib/supabase/query";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = await parseJson(request, rerollSchema);
    const { user, supabase } = await requireUser();
    const { data: avatar, error: avatarError } = await supabase.from("avatars").select("id,seed").eq("owner_id", user.id).single();
    assertQuery(avatarError);
    if (!avatar) throw new ApiError(404, "分身不存在");
    const { data: prompt, error: promptError } = await supabase.from("daily_prompts").select("*").eq("avatar_id", avatar.id).eq("local_date", input.date).maybeSingle();
    assertQuery(promptError);
    if (!prompt || prompt.question_id !== input.currentQuestionId) throw new ApiError(409, "当前问题已经变化");
    if (prompt.reroll_used) throw new ApiError(409, "今天已经换过题");
    const { data: history, error: historyError } = await supabase.from("daily_entries").select("question_id,local_date").eq("avatar_id", avatar.id).order("local_date", { ascending: false }).limit(30);
    assertQuery(historyError);
    const question = selectDailyQuestion({
      avatarSeed: avatar.seed,
      date: input.date,
      history: [...(history ?? [])].reverse().map((item) => ({ date: item.local_date, questionId: item.question_id })),
      excludeId: input.currentQuestionId,
    });
    const { error } = await supabase.from("daily_prompts").update({ question_id: question.id, reroll_used: true }).eq("id", prompt.id).eq("reroll_used", false);
    assertQuery(error, "换题失败");
    return NextResponse.json({ question });
  } catch (error) {
    return apiError(error);
  }
}
