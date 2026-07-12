"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function WechatAuthHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wxcode = params.get("wxcode");
    if (!wxcode) return;

    // 避免重复处理
    if (sessionStorage.getItem("oddling:wxauth")) return;
    sessionStorage.setItem("oddling:wxauth", "1");

    async function auth() {
      try {
        const res = await fetch("/api/wechat-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: wxcode }),
        });
        const data = (await res.json()) as {
          email?: string;
          password?: string;
          error?: string;
        };
        if (data.error || !data.email || !data.password) {
          console.error("微信登录失败:", data.error);
          return;
        }

        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;

        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          // 如果登录失败，尝试注册（首次创建时密码可能不匹配的情况兜底）
          const { error: signUpError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
          });
          if (signUpError) {
            console.error("微信登录失败:", signUpError.message);
            return;
          }
        }

        // 登录成功，去掉 wxcode 参数并刷新
        const url = new URL(window.location.href);
        url.searchParams.delete("wxcode");
        window.location.replace(url.toString());
      } catch (err) {
        console.error("微信登录异常:", err);
      }
    }

    void auth();
  }, []);

  return null;
}
