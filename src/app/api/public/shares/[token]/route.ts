import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { ApiError } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertQuery } from "@/lib/supabase/query";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!/^[a-f0-9]{22,64}$/i.test(token)) throw new ApiError(400, "分享标识不合法");
    const admin = createSupabaseAdminClient();
    if (!admin) throw new ApiError(503, "云端服务尚未配置");
    const { data, error } = await admin.from("shares").select("id,public_token,public_snapshot,expires_at,created_at").eq("public_token", token).maybeSingle();
    assertQuery(error);
    if (!data || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) throw new ApiError(404, "分享不存在或已过期");
    return NextResponse.json({ token: data.public_token, snapshot: data.public_snapshot, createdAt: data.created_at });
  } catch (error) {
    return apiError(error);
  }
}
