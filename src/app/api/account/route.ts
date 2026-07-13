import { NextResponse, type NextRequest } from "next/server";
import { apiError, assertSameOrigin } from "@/lib/api/http";
import { ApiError, requireUser } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { user } = await requireUser(request);
    const admin = createSupabaseAdminClient();
    if (!admin) throw new ApiError(503, "管理服务尚未配置");
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new ApiError(500, "账户删除失败");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
