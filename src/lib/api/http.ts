import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "@/lib/supabase/auth";

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) throw new ApiError(403, "请求来源不合法");
}

export async function parseJson<T>(request: NextRequest, schema: ZodType<T>): Promise<T> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError(400, "请求体必须是 JSON");
  }
  return schema.parse(value);
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "输入不符合要求", issues: error.issues }, { status: 400 });
  }
  console.error("Oddling API error", error instanceof Error ? error.message : "unknown error");
  return NextResponse.json({ error: "服务暂时开小差了" }, { status: 500 });
}
