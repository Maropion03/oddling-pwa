import { NextResponse, type NextRequest } from "next/server";
import { createAvatarSchema } from "@/lib/api/schemas";
import { apiError, assertSameOrigin, parseJson } from "@/lib/api/http";
import { generateAvatar } from "@/lib/domain/engine";
import { ApiError, requireUser } from "@/lib/supabase/auth";
import { assertQuery } from "@/lib/supabase/query";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const input = await parseJson(request, createAvatarSchema);
    const { user, supabase } = await requireUser();
    const { data: existing, error: existingError } = await supabase.from("avatars").select("*").eq("owner_id", user.id).maybeSingle();
    assertQuery(existingError);

    if (existing && !input.rebuild) throw new ApiError(409, "分身已经存在");
    if (existing && input.rebuild) {
      const age = Date.now() - new Date(existing.created_at).getTime();
      if (existing.rebuild_used || age > 24 * 60 * 60 * 1000) throw new ApiError(409, "重建机会不可用");
      const { error } = await supabase.from("avatars").delete().eq("id", existing.id);
      assertQuery(error, "清理旧分身失败");
    }

    const avatar = { ...generateAvatar(input), rebuildUsed: Boolean(existing) };
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, display_name: "Oddling user" }, { onConflict: "id" });
    assertQuery(profileError, "创建用户资料失败");
    const { error: avatarError } = await supabase.from("avatars").insert({
      id: avatar.id,
      owner_id: user.id,
      name: avatar.name,
      seed: avatar.seed,
      traits: avatar.traits,
      parts: avatar.parts,
      mutation_count: avatar.mutationCount,
      rebuild_used: avatar.rebuildUsed,
      created_at: avatar.createdAt,
      updated_at: avatar.createdAt,
    });
    assertQuery(avatarError, "保存分身失败");
    await supabase.from("product_events").insert({ user_id: user.id, event_name: "onboarding_completed", properties: {} });
    return NextResponse.json({ avatar }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
