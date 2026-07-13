import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api/http";
import { refreshWeChatSession } from "@/lib/server/wechat-session";

const refreshSchema = z.object({ refreshToken: z.string().min(1).max(4096) });

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await parseJson(request, refreshSchema);
    const session = await refreshWeChatSession(refreshToken);
    return NextResponse.json({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}
