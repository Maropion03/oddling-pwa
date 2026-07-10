"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, HardDrive, Mail, MonitorSmartphone, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/app-shell";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { useOddling } from "@/components/providers/oddling-provider";
import type { AppState } from "@/lib/domain/types";

export function MeView() {
  const router = useRouter();
  const { state, hydrated, cloudConfigured, renameAvatar, setTheme, exportState, deleteAllData } = useOddling();
  const avatar = state.avatar;
  const [draftName, setDraftName] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  function downloadExport() {
    const blob = new Blob([exportState()], { type: "application/json" });
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

  function remove() {
    deleteAllData();
    router.replace("/");
  }

  const createdWithin24Hours = now - new Date(avatar.createdAt).getTime() <= 24 * 60 * 60 * 1000;
  const canRebuild = createdWithin24Hours && !avatar.rebuildUsed;

  return (
    <AppShell>
      <div className="page-wrap me-page">
        <header className="page-head">
          <div className="page-head__copy"><p className="eyebrow">LOCAL SPECIMEN SETTINGS</p><h1 className="page-title">我的</h1></div>
          <span className="status-strip"><span className="status-dot"/>{cloudConfigured ? "云端账户" : "本机体验模式"}</span>
        </header>

        <section className="identity-row">
          <AvatarFigure parts={avatar.parts} name={avatar.name} size="medium"/>
          <div className="identity-row__copy">
            <p className="eyebrow">IDENTITY</p>
            <div className="field">
              <label htmlFor="rename">分身名字</label>
              <div className="inline-field"><input id="rename" className="input" maxLength={12} value={name} onChange={(event) => setDraftName(event.target.value)}/><button className="btn" onClick={() => { renameAvatar(name); setDraftName(null); }} disabled={!name.trim() || name.trim() === avatar.name}>保存</button></div>
            </div>
            <p className="settings-note">它已经发生 {avatar.mutationCount} 次永久变异。外观不能手动编辑。</p>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__title"><span>01</span><div><h2>账户与恢复</h2><p>匿名开始，想跨设备时再绑定邮箱。</p></div></div>
          <div className="settings-list">
            <div className="settings-item"><Mail/><div><strong>{cloudConfigured ? "邮箱账户可用" : "云端尚未连接"}</strong><span>{cloudConfigured ? "可以发送 OTP 并升级匿名账户" : "当前数据只保存在这台设备的浏览器中"}</span></div><button className="btn" disabled={!cloudConfigured}>{cloudConfigured ? "绑定邮箱" : "待部署配置"}</button></div>
            <div className="settings-item"><HardDrive/><div><strong>导出全部数据</strong><span>下载角色、回答、变异、贴纸与分享记录的 JSON</span></div><button className="btn" onClick={downloadExport}><Download size={17}/>导出</button></div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section__title"><span>02</span><div><h2>外观与安装</h2><p>跟随系统，也可以单独覆盖。</p></div></div>
          <div className="settings-list">
            <div className="settings-item"><MonitorSmartphone/><div><strong>颜色主题</strong><span>亮色、暗色与系统模式</span></div><div className="segmented" role="group" aria-label="颜色主题">{(["system", "light", "dark"] as AppState["theme"][]).map((theme) => <button key={theme} aria-pressed={state.theme === theme} onClick={() => setTheme(theme)}>{theme === "system" ? "系统" : theme === "light" ? "亮色" : "暗色"}</button>)}</div></div>
            <div className="settings-item"><ExternalLink/><div><strong>{installMode === "installed" ? "已作为应用打开" : "安装 Oddling"}</strong><span>{installMode === "ios" ? "Safari 分享菜单 → 添加到主屏幕" : installMode === "installed" ? "正在 standalone 模式运行" : "浏览器菜单 → 安装应用；Windows 与 Android 均适用"}</span></div><span className="settings-badge">PWA</span></div>
          </div>
        </section>

        <section className="settings-section danger-zone">
          <div className="settings-section__title"><span>03</span><div><h2>重新开始</h2><p>这些操作会改变或删除已有记录。</p></div></div>
          <div className="settings-list">
            <div className="settings-item"><RotateCcw/><div><strong>清空并重建一次</strong><span>{canRebuild ? "创建后 24 小时内可用，旧数据会全部删除" : "重建机会不可用或已使用"}</span></div><button className="btn" disabled={!canRebuild} onClick={rebuild}>重新回答</button></div>
            <div className="settings-item"><Trash2/><div><strong>删除全部数据</strong><span>本机数据立即删除；云端模式也会删除认证账户</span></div>{confirmDelete ? <div className="confirm-actions"><button className="btn btn--danger" onClick={remove}>确定删除</button><button className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>取消</button></div> : <button className="btn btn--danger" onClick={() => setConfirmDelete(true)}>删除</button>}</div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
