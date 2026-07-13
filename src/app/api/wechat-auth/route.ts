import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "网页套壳登录已下线，请使用原生小程序登录。" },
    { status: 410 },
  );
}
