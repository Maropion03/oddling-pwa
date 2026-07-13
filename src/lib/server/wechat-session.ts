import "server-only";

import { createHash } from "crypto";
import { createClient, type Session } from "@supabase/supabase-js";
import { ApiError } from "@/lib/supabase/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { assertQuery } from "@/lib/supabase/query";

type WeChatCodeResponse = { openid?: string; errcode?: number; errmsg?: string };

function requiredEnv(name: "WECHAT_APPID" | "WECHAT_APPSECRET" | "WECHAT_AUTH_PEPPER") {
  const value = process.env[name];
  if (!value) throw new ApiError(503, "微信登录尚未配置");
  return value;
}

function credential(openid: string) {
  const pepper = requiredEnv("WECHAT_AUTH_PEPPER");
  return createHash("sha256").update(`${openid}:${pepper}`).digest("hex");
}

function internalEmail(openid: string) {
  return `wx_${createHash("sha256").update(openid).digest("hex").slice(0, 24)}@wechat.oddling.app`;
}

export async function exchangeWeChatCode(code: string) {
  const appid = requiredEnv("WECHAT_APPID");
  const secret = requiredEnv("WECHAT_APPSECRET");
  const response = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`,
    { cache: "no-store" },
  );
  const payload = await response.json().catch(() => null) as WeChatCodeResponse | null;
  if (!response.ok || !payload?.openid || payload.errcode) {
    throw new ApiError(401, payload?.errmsg ?? "微信登录凭证无效");
  }
  return payload.openid;
}

async function signIn(email: string, password: string): Promise<Session> {
  const config = getSupabasePublicConfig();
  if (!config) throw new ApiError(503, "云端服务尚未配置");
  const client = createClient(config.url, config.anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new ApiError(401, "登录会话创建失败");
  return data.session;
}

export async function createWeChatSession(code: string): Promise<Session> {
  const openid = await exchangeWeChatCode(code);
  const email = internalEmail(openid);
  const password = credential(openid);
  const admin = createSupabaseAdminClient();
  if (!admin) throw new ApiError(503, "云端服务尚未配置");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("wechat_openid", openid)
    .maybeSingle();
  assertQuery(profileError, "读取微信账户失败");

  if (!profile) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) throw new ApiError(500, createError?.message ?? "创建微信账户失败");
    const { error: insertError } = await admin.from("profiles").insert({
      id: created.user.id,
      display_name: "Oddling user",
      wechat_openid: openid,
      theme: "light",
    });
    if (insertError) {
      await admin.auth.admin.deleteUser(created.user.id);
      assertQuery(insertError, "创建微信资料失败");
    }
  }

  try {
    return await signIn(email, password);
  } catch (error) {
    if (!profile) throw error;
    const { error: resetError } = await admin.auth.admin.updateUserById(profile.id, { password });
    if (resetError) throw new ApiError(500, "更新微信登录凭证失败");
    return signIn(email, password);
  }
}

export async function refreshWeChatSession(refreshToken: string): Promise<Session> {
  const config = getSupabasePublicConfig();
  if (!config) throw new ApiError(503, "云端服务尚未配置");
  const client = createClient(config.url, config.anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) throw new ApiError(401, "微信登录已过期");
  return data.session;
}
