import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { DAILY_QUESTIONS } from "@/lib/domain/questions";
import { EMPTY_STATE, type AppState, type DailyEntry, type Mutation, type ShareRecord } from "@/lib/domain/types";
import { requireUser } from "@/lib/supabase/auth";
import { avatarFromRow, snapshotFromRow, stickerFromRow } from "@/lib/supabase/mappers";
import { assertQuery } from "@/lib/supabase/query";

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data: avatarRow, error: avatarError } = await supabase.from("avatars").select("*").eq("owner_id", user.id).maybeSingle();
    assertQuery(avatarError);
    if (!avatarRow) return NextResponse.json({ state: EMPTY_STATE });
    const avatar = avatarFromRow(avatarRow);
    const [entryRows, mutationRows, stickerRows, shareRows, promptRows, profileRow] = await Promise.all([
      supabase.from("daily_entries").select("*").eq("avatar_id", avatar.id).order("local_date"),
      supabase.from("mutations").select("*").eq("avatar_id", avatar.id).order("created_at"),
      supabase.from("stickers").select("*").eq("owner_id", user.id).order("created_at"),
      supabase.from("shares").select("*").eq("owner_id", user.id).order("created_at"),
      supabase.from("daily_prompts").select("*").eq("avatar_id", avatar.id).order("local_date"),
      supabase.from("profiles").select("theme").eq("id", user.id).maybeSingle(),
    ]);
    for (const result of [entryRows, mutationRows, stickerRows, shareRows, promptRows, profileRow]) assertQuery(result.error);

    const mutations: Mutation[] = (mutationRows.data ?? []).map((row) => ({
      id: row.id,
      date: row.created_at.slice(0, 10),
      slot: row.slot,
      token: row.token,
      label: row.label,
      previousToken: row.previous_token,
    }));
    const stickers = (stickerRows.data ?? []).map((row) => stickerFromRow(row));
    const entries: DailyEntry[] = (entryRows.data ?? []).map((row) => {
      const mutation = mutations.find((item) => item.id === (mutationRows.data ?? []).find((raw) => raw.entry_id === row.id)?.id);
      const sticker = stickers.find((item) => item.kind === "daily" && item.date === row.local_date);
      return {
        id: row.id,
        date: row.local_date,
        questionId: row.question_id,
        question: DAILY_QUESTIONS.find((item) => item.id === row.question_id)?.prompt ?? "今天发生了什么？",
        answer: row.answer,
        response: row.response_text,
        traitDelta: row.trait_delta,
        mutation: mutation ?? { id: crypto.randomUUID(), date: row.local_date, slot: "texture", token: "dots", label: "一次小变化", previousToken: null },
        sticker: sticker ?? { id: crypto.randomUUID(), kind: "daily", title: "今日已存档", subtitle: "一次小变化", date: row.local_date, tone: "yellow" },
      };
    });
    const shares: ShareRecord[] = (shareRows.data ?? []).map((row) => ({
      id: row.public_token,
      createdAt: row.created_at,
      snapshot: snapshotFromRow(row.public_snapshot),
    }));
    const rerolls = Object.fromEntries((promptRows.data ?? []).filter((row) => row.reroll_used).map((row) => [row.local_date, row.question_id]));

    const state: AppState = {
      ...EMPTY_STATE,
      avatar,
      entries,
      mutations,
      stickers,
      shares,
      questionHistory: entries.map((entry) => ({ date: entry.date, questionId: entry.questionId })),
      rerolls,
      theme: profileRow.data?.theme ?? "system",
    };
    return NextResponse.json({ state });
  } catch (error) {
    return apiError(error);
  }
}
