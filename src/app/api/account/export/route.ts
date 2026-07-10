import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/auth";
import { assertQuery } from "@/lib/supabase/query";

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data: avatar, error: avatarError } = await supabase.from("avatars").select("*").eq("owner_id", user.id).maybeSingle();
    assertQuery(avatarError);
    const avatarId = avatar?.id ?? "00000000-0000-0000-0000-000000000000";
    const [profile, entries, mutations, stickers, shares, events] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("daily_entries").select("*").eq("avatar_id", avatarId).order("created_at"),
      supabase.from("mutations").select("*").eq("avatar_id", avatarId).order("created_at"),
      supabase.from("stickers").select("*").eq("owner_id", user.id).order("created_at"),
      supabase.from("shares").select("*").eq("owner_id", user.id).order("created_at"),
      supabase.from("product_events").select("event_name,properties,created_at").eq("user_id", user.id).order("created_at"),
    ]);
    for (const result of [profile, entries, mutations, stickers, shares, events]) assertQuery(result.error);
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      product: "Oddling",
      data: { profile: profile.data, avatar, entries: entries.data, mutations: mutations.data, stickers: stickers.data, shares: shares.data, events: events.data },
    }, { headers: { "Content-Disposition": `attachment; filename="oddling-export-${new Date().toISOString().slice(0, 10)}.json"` } });
  } catch (error) {
    return apiError(error);
  }
}
