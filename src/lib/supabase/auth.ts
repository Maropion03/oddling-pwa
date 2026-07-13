import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient, createSupabaseTokenClient } from "./server";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(request?: Request): Promise<{ user: User; supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>> }> {
  const authorization = request?.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const supabase = accessToken ? createSupabaseTokenClient(accessToken) : await createSupabaseServerClient();
  if (!supabase) throw new ApiError(503, "云端服务尚未配置");
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new ApiError(401, "需要有效的用户会话");
  return { user: data.user, supabase };
}
