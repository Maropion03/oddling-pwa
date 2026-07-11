import { NextResponse, type NextRequest } from "next/server";
import { apiError, assertSameOrigin, parseJson } from "@/lib/api/http";
import { shareExpirySchema } from "@/lib/api/schemas";
import { ApiError, requireUser } from "@/lib/supabase/auth";
import { assertQuery } from "@/lib/supabase/query";

async function assertOwnedShare(token: string) {
  const { user, supabase } = await requireUser();
  const { data, error } = await supabase.from("shares").select("id").eq("public_token", token).eq("owner_id", user.id).maybeSingle();
  assertQuery(error);
  if (!data) throw new ApiError(404, "分享记录不存在");
  return { supabase, id: data.id };
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await params;
    const { supabase, id } = await assertOwnedShare(token);
    const { error } = await supabase.from("shares").delete().eq("id", id);
    assertQuery(error, "撤销分享失败");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    assertSameOrigin(request);
    const { token } = await params;
    const input = await parseJson(request, shareExpirySchema);
    const { supabase, id } = await assertOwnedShare(token);
    const expiresAt = input.expiresInDays === null ? null : new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("shares").update({ expires_at: expiresAt }).eq("id", id);
    assertQuery(error, "更新有效期失败");
    return NextResponse.json({ expiresAt });
  } catch (error) {
    return apiError(error);
  }
}
