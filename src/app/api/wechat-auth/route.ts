import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_APPSECRET = process.env.WECHAT_APPSECRET;

function hashOpenid(openid: string): string {
  return createHash("sha256").update(openid).digest("hex").slice(0, 16);
}

function derivePassword(openid: string): string {
  const salt = WECHAT_APPSECRET ?? "oddling-wechat-fallback-salt";
  return createHash("sha256").update(openid + salt).digest("hex").slice(0, 32);
}

export async function POST(request: NextRequest) {
  try {
    const { code } = (await request.json()) as { code?: string };
    if (!code) {
      return NextResponse.json({ error: "缺少微信登录凭证" }, { status: 400 });
    }
    if (!WECHAT_APPID || !WECHAT_APPSECRET) {
      return NextResponse.json(
        { error: "微信登录尚未配置" },
        { status: 503 },
      );
    }

    // 1. 用 code 换 openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_APPSECRET}&js_code=${code}&grant_type=authorization_code`,
    );
    const tokenData = (await tokenRes.json()) as {
      openid?: string;
      unionid?: string;
      session_key?: string;
      errcode?: number;
      errmsg?: string;
    };
    if (tokenData.errcode) {
      return NextResponse.json(
        { error: tokenData.errmsg ?? "微信接口调用失败" },
        { status: 400 },
      );
    }
    const openid = tokenData.openid;
    if (!openid) {
      return NextResponse.json(
        { error: "无法获取微信用户标识" },
        { status: 400 },
      );
    }

    // 2. 生成 email 和 password
    const email = `wx_${hashOpenid(openid)}@wechat.oddling.app`;
    const password = derivePassword(openid);

    // 3. Supabase admin
    const admin = createSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "云端服务尚未配置" },
        { status: 503 },
      );
    }

    // 4. 查找已有用户
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, wechat_openid")
      .eq("wechat_openid", openid)
      .maybeSingle();

    if (!existingProfile) {
      // 5. 创建新用户
      const { data: userData, error: createError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
      if (createError) {
        if (createError.message?.includes("already registered")) {
          // email 已存在，继续返回已有凭证
        } else {
          return NextResponse.json(
            { error: createError.message },
            { status: 500 },
          );
        }
      } else if (userData.user) {
        // 插入 profiles
        await admin.from("profiles").insert({
          id: userData.user.id,
          display_name: "Oddling user",
          wechat_openid: openid,
        });
      }
    }

    return NextResponse.json({ email, password, openid });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 },
    );
  }
}
