import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "./server";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<{ user: User; supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>> }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new ApiError(503, "云端服务尚未配置");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiError(401, "需要有效的用户会话");
  return { user: data.user, supabase };
}
