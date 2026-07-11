"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, HardDrive, Link2, Mail, MonitorSmartphone, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/app-shell";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { useOddling } from "@/components/providers/oddling-provider";
import type { AppState } from "@/lib/domain/types";

export function MeView() {
  const router = useRouter();
  const { state, hydrated, cloudConfigured, cloudStatus, cloudError, renameAvatar, setTheme, exportState, deleteAllData, linkEmail, revokeShare, setShareExpiry } = useOddling();
  const avatar = state.avatar;
  const [draftName, setDraftName] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [now] = useState(() => Date.now());
  const [installMode] = useState<"ios" | "browser" | "installed">(() => {
    if (typeof window === "undefined") return "browser";
    if (window.matchMedia("(display-mode: standalone)").matches) return "installed";
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return "ios";
    return "browser";
  });

  useEffect(() => {
    if (hydrated && !avatar) router.replace("/create");
  }, [avatar, hydrated, router]);

  if (!hydrated || !avatar) return <div className="loading-screen"><span className="loading-mark"/></div>;
  const name = draftName ?? avatar.name;

  async function downloadExport() {
    const content = cloudConfigured
      ? await fetch("/api/account/export").then(async (response) => {
          if (!response.ok) throw new Error("云端导出失败");
          return response.text();
        })
      : exportState();
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `oddling-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function rebuild() {
    window.sessionStorage.setItem("oddling:rebuild", "1");
    router.push("/create");
  }

  async function remove() {
    await deleteAllData();
    router.replace("/");
  }

  async function sendLinkEmail() {
    if (!email.trim()) return;
    setEmailStatus("sending");
    try {
      await linkEmail(email.trim());
      setEmailStatus("sent");
    } catch {
      setEmailStatus("idle");
    }
  }

  const createdWithin24Hours = now - new Date(avatar.createdAt).getTime() <= 24 * 60 * 60 * 1000;
  const canRebuild = createdWithin24Hours && !avatar.rebuildUsed;
  const shareExpiryOption = (expiresAt: string | null) => {
    if (!expiresAt) return "never";
    const days = Math.ceil((new Date(expiresAt).getTime() - now) / (24 * 60 * 60 * 1000));
    return days <= 10 ? "7" : days <= 60 ? "30" : "90";
  };

  return (
    <AppShell>
      <div className="page-wrap me-page">
        <header className="page-head">
          <div className="page-head__copy"><p className="eyebrow">LOCAL SPECIMEN SETTINGS</p><h1 className="page-title">我的</h1></div>
          <span className="status-strip"><span className="status-dot"/>{cloudStatus === "synced" ? "云端已同步" : cloudStatus === "connecting" ? "正在连接" : cloudStatus === "error" ? "同步失败" : "本机体验模式"}</span>
        </header>

        <section className="identity-row">
          <AvatarFigure parts={avatar.parts} name={avatar.name} size="medium"/>
          <div className="identity-row__copy">
            <p className="eyebrow">IDENTITY</p>
            <div className="field">
              <label htmlFor="rename">分身名字</label>
              <div className="inline-field"><input id="rename" className="input" maxLength={12} value={name} onChange={(event) => setDraftName(event.target.value)}/><button className="btn" onClick={() => { void renameAvatar(name).then(() => setDraftName(null)); }} disabled={!name.trim() || name.trim() === avatar.name}>保存</button></div>
            </div>
            <p className="settings-note">它已经发生 {avatar.mutationCount} 次永久变异。外观不能手动编辑。</p>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__title"><span>01</span><div><h2>账户与恢复</h2><p>匿名开始，想跨设备时再绑定邮箱。</p></div></div>
          <div className="settings-list">
            <div className="settings-item settings-item--email"><Mail/><div><strong>{cloudConfigured ? "绑定恢复邮箱" : "云端尚未连接"}</strong><span>{emailStatus === "sent" ? "验证邮件已发送，请在同一浏览器完成确认" : cloudConfigured ? "通过邮件链接升级匿名账户，原数据不会丢失" : "当前数据只保存在这台设备的浏览器中"}</span></div>{cloudConfigured ? <div className="email-bind"><input className="input" type="email" aria-label="恢复邮箱" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)}/><button className="btn" disabled={!email.trim() || emailStatus === "sending"} onClick={() => void sendLinkEmail()}>{emailStatus === "sending" ? "发送中" : "发送验证"}</button></div> : <button className="btn" disabled>待部署配置</button>}</div>
            {cloudError && <p className="form-error" role="alert">{cloudError}</p>}
            <div className="settings-item"><HardDrive/><div><strong>导出全部数据</strong><span>下载角色、回答、变异、贴纸与分享记录的 JSON</span></div><button className="btn" onClick={() => void downloadExport()}><Download size={17}/>导出</button></div>
            <div className="settings-item"><ExternalLink/><div><strong>隐私与反馈</strong><span>查看保存内容、公开范围、模型调用及数据处理方式。</span></div><Link className="btn" href="/privacy">查看说明</Link></div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__title"><span>02</span><div><h2>外观与安装</h2><p>跟随系统，也可以单独覆盖。</p></div></div>
          <div className="settings-list">
            <div className="settings-item"><MonitorSmartphone/><div><strong>颜色主题</strong><span>亮色、暗色与系统模式</span></div><div className="segmented" role="group" aria-label="颜色主题">{(["system", "light", "dark"] as AppState["theme"][]).map((theme) => <button key={theme} aria-pressed={state.theme === theme} onClick={() => setTheme(theme)}>{theme === "system" ? "系统" : theme === "light" ? "亮色" : "暗色"}</button>)}</div></div>
            <div className="settings-item"><ExternalLink/><div><strong>{installMode === "installed" ? "已作为应用打开" : "安装 Oddling"}</strong><span>{installMode === "ios" ? "Safari 分享菜单 → 添加到主屏幕" : installMode === "installed" ? "正在 standalone 模式运行" : "浏览器菜单 → 安装应用；Windows 与 Android 均适用"}</span></div><span className="settings-badge">PWA</span></div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__title"><span>03</span><div><h2>公开分享</h2><p>默认公开 30 天，可随时撤销或调整。</p></div></div>
          <div className="settings-list">
            {state.shares.length === 0 ? <div className="settings-item"><Link2/><div><strong>还没有公开链接</strong><span>完成一次每日喂养后，可以把分身发给熟人。</span></div></div> : state.shares.map((share) => (
              <div className="settings-item settings-item--share" key={share.id}>
                <Link2/>
                <div><strong>{share.snapshot.name} 的公开链接</strong><span>{share.expiresAt ? `有效至 ${new Date(share.expiresAt).toLocaleDateString("zh-CN")}` : "长期公开"}</span></div>
                <select aria-label={`${share.snapshot.name} 的分享有效期`} value={shareExpiryOption(share.expiresAt)} onChange={(event) => void setShareExpiry(share.id, event.target.value === "never" ? null : Number(event.target.value) as 7 | 30 | 90)}>
                  <option value="7">7 天</option><option value="30">30 天</option><option value="90">90 天</option><option value="never">长期</option>
                </select>
                <button className="btn btn--danger" onClick={() => void revokeShare(share.id)}>撤销</button>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-section danger-zone">
          <div className="settings-section__title"><span>04</span><div><h2>重新开始</h2><p>这些操作会改变或删除已有记录。</p></div></div>
          <div className="settings-list">
            <div className="settings-item"><RotateCcw/><div><strong>清空并重建一次</strong><span>{canRebuild ? "创建后 24 小时内可用，旧数据会全部删除" : "重建机会不可用或已使用"}</span></div><button className="btn" disabled={!canRebuild} onClick={rebuild}>重新回答</button></div>
            <div className="settings-item"><Trash2/><div><strong>删除全部数据</strong><span>本机数据立即删除；云端模式也会删除认证账户</span></div>{confirmDelete ? <div className="confirm-actions"><button className="btn btn--danger" onClick={() => void remove()}>确定删除</button><button className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>取消</button></div> : <button className="btn btn--danger" onClick={() => setConfirmDelete(true)}>删除</button>}</div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
