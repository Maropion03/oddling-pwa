import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api/http";
import { createWeChatSession } from "@/lib/server/wechat-session";

const loginSchema = z.object({ code: z.string().trim().min(1).max(512) });

export async function POST(request: NextRequest) {
  try {
    const { code } = await parseJson(request, loginSchema);
    const session = await createWeChatSession(code);
    return NextResponse.json({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}
