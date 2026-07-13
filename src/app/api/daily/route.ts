import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/http";
import { dailyDateSchema } from "@/lib/api/schemas";
import { selectDailyQuestion } from "@/lib/domain/engine";
import { DAILY_QUESTIONS } from "@/lib/domain/questions";
import { ApiError, requireUser } from "@/lib/supabase/auth";
import { assertQuery } from "@/lib/supabase/query";

export async function GET(request: NextRequest) {
  try {
    const query = dailyDateSchema.parse({ date: request.nextUrl.searchParams.get("date"), timezone: request.nextUrl.searchParams.get("timezone") });
    const { user, supabase } = await requireUser(request);
    const { data: avatar, error: avatarError } = await supabase.from("avatars").select("*").eq("owner_id", user.id).maybeSingle();
    assertQuery(avatarError);
    if (!avatar) throw new ApiError(404, "分身不存在");

    const [{ data: prompt, error: promptError }, { data: entry, error: entryError }, { data: history, error: historyError }] = await Promise.all([
      supabase.from("daily_prompts").select("*").eq("avatar_id", avatar.id).eq("local_date", query.date).maybeSingle(),
      supabase.from("daily_entries").select("*").eq("avatar_id", avatar.id).eq("local_date", query.date).maybeSingle(),
      supabase.from("daily_entries").select("question_id,local_date").eq("avatar_id", avatar.id).order("local_date", { ascending: false }).limit(30),
    ]);
    assertQuery(promptError); assertQuery(entryError); assertQuery(historyError);
    if (entry) return NextResponse.json({ entry, question: DAILY_QUESTIONS.find((item) => item.id === entry.question_id) ?? null });
    if (prompt) return NextResponse.json({ prompt, question: DAILY_QUESTIONS.find((item) => item.id === prompt.question_id) ?? null });

    const question = selectDailyQuestion({
      avatarSeed: avatar.seed,
      date: query.date,
      history: [...(history ?? [])].reverse().map((item) => ({ date: item.local_date, questionId: item.question_id })),
    });
    const { data: createdPrompt, error: createError } = await supabase.from("daily_prompts").upsert({
      avatar_id: avatar.id, local_date: query.date, timezone: query.timezone, question_id: question.id,
    }, { onConflict: "avatar_id,local_date" }).select("*").single();
    assertQuery(createError, "保存今日问题失败");
    await supabase.from("product_events").insert({ user_id: user.id, event_name: "daily_question_viewed", properties: { questionId: question.id } });
    return NextResponse.json({ prompt: createdPrompt, question });
  } catch (error) {
    return apiError(error);
  }
}
