import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { apiError, assertSameOrigin, parseJson } from "@/lib/api/http";
import { guestInteractionSchema } from "@/lib/api/schemas";
import { createGuestInteraction } from "@/lib/domain/engine";
import type { ShareRecord } from "@/lib/domain/types";
import { ApiError } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { snapshotFromRow } from "@/lib/supabase/mappers";
import { assertQuery } from "@/lib/supabase/query";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await params;
    const input = await parseJson(request, guestInteractionSchema);
    const admin = createSupabaseAdminClient();
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!admin || !secret) throw new ApiError(503, "云端服务尚未配置");
    const { data: row, error: shareError } = await admin.from("shares").select("*").eq("public_token", token).maybeSingle();
    assertQuery(shareError);
    if (!row || (row.expires_at && new Date(row.expires_at).getTime() <= Date.now())) throw new ApiError(404, "分享不存在或已过期");

    const { data: existing, error: existingError } = await admin.from("guest_interactions").select("*").eq("share_id", row.id).eq("visitor_id", input.visitorId).maybeSingle();
    assertQuery(existingError);
    if (existing) return NextResponse.json({
      idempotent: true,
      interaction: {
        shareId: token,
        visitorId: input.visitorId,
        action: existing.action,
        response: existing.response_text,
        sticker: existing.sticker_payload,
        createdAt: existing.created_at,
      },
    });

    const share: ShareRecord = {
      id: token,
      createdAt: row.created_at,
      snapshot: snapshotFromRow(row.public_snapshot),
    };
    const interaction = createGuestInteraction({ share, visitorId: input.visitorId, action: input.action });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const dailySalt = new Date().toISOString().slice(0, 10);
    const visitorRateHash = createHmac("sha256", secret).update(`${dailySalt}:${ip}`).digest("hex");
    const { error: insertError } = await admin.from("guest_interactions").insert({
      share_id: row.id,
      visitor_id: input.visitorId,
      visitor_rate_hash: visitorRateHash,
      action: interaction.action,
      response_text: interaction.response,
      sticker_payload: interaction.sticker,
    });
    assertQuery(insertError, "保存访客互动失败");
    const { error: stickerError } = await admin.from("stickers").insert({
      id: interaction.sticker.id,
      owner_id: row.owner_id,
      avatar_id: row.avatar_id,
      kind: "relationship",
      title: interaction.sticker.title,
      payload: interaction.sticker,
    });
    assertQuery(stickerError, "保存关系贴纸失败");
    await admin.from("product_events").insert({ user_id: null, anonymous_session_id: input.visitorId, event_name: "guest_interacted", properties: { action: input.action } });
    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
