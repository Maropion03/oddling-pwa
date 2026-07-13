import { NextResponse, type NextRequest } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api/http";
import { createShare } from "@/lib/domain/engine";
import { ApiError, requireUser } from "@/lib/supabase/auth";
import { avatarFromRow, stickerFromRow } from "@/lib/supabase/mappers";
import { assertQuery } from "@/lib/supabase/query";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { user, supabase } = await requireUser(request);
    const { data: avatarRow, error: avatarError } = await supabase.from("avatars").select("*").eq("owner_id", user.id).maybeSingle();
    assertQuery(avatarError);
    if (!avatarRow) throw new ApiError(404, "分身不存在");
    const { data: stickerRow, error: stickerError } = await supabase.from("stickers").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    assertQuery(stickerError);
    const share = createShare(avatarFromRow(avatarRow), stickerRow ? stickerFromRow(stickerRow) : null);
    const { error } = await supabase.from("shares").insert({
      owner_id: user.id,
      avatar_id: avatarRow.id,
      public_token: share.id,
      public_snapshot: share.snapshot,
      expires_at: share.expiresAt,
    });
    assertQuery(error, "创建分享失败");
    await supabase.from("product_events").insert({ user_id: user.id, event_name: "share_created", properties: {} });
    return NextResponse.json({ token: share.id, snapshot: share.snapshot, expiresAt: share.expiresAt }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
