import { NextResponse, type NextRequest } from "next/server";
import { apiError, assertSameOrigin, parseJson } from "@/lib/api/http";
import { renameAvatarSchema } from "@/lib/api/schemas";
import { requireUser } from "@/lib/supabase/auth";
import { assertQuery } from "@/lib/supabase/query";

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { name } = await parseJson(request, renameAvatarSchema);
    const { user, supabase } = await requireUser();
    const { error } = await supabase.from("avatars").update({ name, updated_at: new Date().toISOString() }).eq("owner_id", user.id);
    assertQuery(error, "改名失败");
    return NextResponse.json({ name });
  } catch (error) {
    return apiError(error);
  }
}
