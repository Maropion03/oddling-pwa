"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, RefreshCw, Send, Share2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/app-shell";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { StickerCard } from "@/components/sticker/sticker-card";
import { ResultImageMaker } from "@/components/share/result-image-maker";
import { useOddling } from "@/components/providers/oddling-provider";
import type { DailyEntry } from "@/lib/domain/types";
import { compactDate, plainText } from "@/lib/text";

export function HomeView() {
  const router = useRouter();
  const {
    state, hydrated, today, todayEntry, todayQuestion, cloudConfigured,
    rerollQuestion, submitDailyAnswer, makeShare,
  } = useOddling();
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState<DailyEntry | null>(null);
  const [sharing, setSharing] = useState<"idle" | "copied">("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [dailyAction, setDailyAction] = useState<"idle" | "rerolling" | "submitting">("idle");
  const [archivePage, setArchivePage] = useState(1);
  const avatar = state.avatar;

  useEffect(() => {
    if (hydrated && !avatar) router.replace("/create");
  }, [avatar, hydrated, router]);

  if (!hydrated || !avatar || !todayQuestion) {
    return <div className="loading-screen"><span className="loading-mark" aria-label="正在寻找分身"/></div>;
  }
  const avatarName = avatar.name;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (answer.trim().length < 1 || answer.length > 60 || todayEntry || dailyAction !== "idle") return;
    setDailyAction("submitting");
    try {
      const entry = await submitDailyAnswer(answer);
      setRevealed(entry);
      setAnswer("");
      setArchivePage(1);
    } finally {
      setDailyAction("idle");
    }
  }

  async function reroll() {
    if (dailyAction !== "idle") return;
    setDailyAction("rerolling");
    try {
      await rerollQuestion();
    } finally {
      setDailyAction("idle");
    }
  }

  async function share() {
    const shareRecord = await makeShare();
    const url = `${window.location.origin}/p/${shareRecord.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${avatarName} 今天又长歪了一点`, text: "来戳一下我的 Oddling", url });
        return;
      } catch {
        // The user can cancel the native share sheet; the explicit copy action remains available.
      }
    }
    await copyText(url);
    setSharing("copied");
    window.setTimeout(() => setSharing("idle"), 1800);
  }

  async function copyText(value: string) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("clipboard timeout")), 500)),
      ]);
      return;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }

  async function copyShare() {
    const shareRecord = await makeShare();
    const url = `${window.location.origin}/p/${shareRecord.id}`;
    await copyText(url);
    setShareUrl(url);
    setSharing("copied");
    window.setTimeout(() => setSharing("idle"), 1800);
  }

  const completed = revealed ?? todayEntry;

  return (
    <AppShell>
      <div className="home-layout">
        <section className="nest-stage">
          <div className="nest-stage__top">
            <div>
              <p className="eyebrow">YOUR ODDLING {compactDate(today)}</p>
              <h1 className="page-title">{avatar.name}</h1>
            </div>
            <span className="status-strip"><span className="status-dot"/>{cloudConfigured ? "已同步" : "本机保存"}</span>
          </div>
          <div className="nest-stage__figure">
            <span className="orbit-label orbit-label--left">变异 {avatar.mutationCount}</span>
            <AvatarFigure parts={avatar.parts} name={avatar.name} size="medium" />
            <span className="orbit-label orbit-label--right">{avatar.traits.oddness > 58 ? "怪度偏高" : "暂时克制"}</span>
          </div>
          <p className="avatar-caption">{completed ? plainText(completed.response) : "它今天还没有形成新的意见"}</p>
        </section>

        <section className="daily-panel">
          <div className="daily-panel__head">
            <span className="daily-number">DAY {String(state.entries.length + (todayEntry ? 0 : 1)).padStart(2, "0")}</span>
            {!completed && (
              <button className="icon-action" onClick={() => void reroll()} disabled={Boolean(state.rerolls[today]) || dailyAction !== "idle"} title={state.rerolls[today] ? "今天已经换过题" : "换一道题"}>
                <RefreshCw size={18}/><span>{dailyAction === "rerolling" ? "换题中" : state.rerolls[today] ? "已换题" : "换一题"}</span>
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {completed ? (
              <motion.div key="complete" className="daily-complete" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                <div className="daily-archive-flipper">
                  <AnimatePresence initial={false}>
                    {archivePage === 1 && (
                      <motion.div
                        key="page1"
                        className="daily-archive-page"
                        initial={{ rotateY: -82, x: -28, opacity: 0 }}
                        animate={{ rotateY: 0, x: 0, opacity: 1 }}
                        exit={{ rotateY: -82, x: -28, opacity: 0 }}
                        transition={{ duration: 0.34, ease: "easeInOut" }}
                        style={{ transformOrigin: "left center" }}
                      >
                        <span className="completion-mark"><Check size={26}/></span>
                        <div className="daily-archive-page__meta"><p className="eyebrow">TODAY IS ARCHIVED</p><span>01 OF 02</span></div>
                        <h2>{plainText(completed.question)}</h2>
                        <blockquote>{completed.answer}</blockquote>
                        <div className="mutation-line"><Sparkles size={18}/><span>新变异</span><strong>{plainText(completed.mutation.label)}</strong></div>
                        <StickerCard sticker={completed.sticker} compact />
                        <div className="daily-share-actions">
                          <button className="btn btn--blue" onClick={share}><Share2 size={18}/>发给一个熟人</button>
                          <button className="btn" onClick={copyShare}>{sharing === "copied" ? <><Check size={18}/>链接已复制</> : <><Copy size={18}/>复制链接</>}</button>
                        </div>
                        {shareUrl && <a className="share-preview-link" href={shareUrl}>预览好友看到的页面</a>}
                        <p className="privacy-note">分享只包含角色快照和贴纸不包含你的回答</p>
                        <button className="btn btn--primary" onClick={() => setArchivePage(2)}>去保存</button>
                      </motion.div>
                    )}
                    {archivePage === 2 && (
                      <motion.div
                        key="page2"
                        className="daily-archive-page daily-archive-page--export"
                        initial={{ rotateY: 82, x: 28, opacity: 0 }}
                        animate={{ rotateY: 0, x: 0, opacity: 1 }}
                        exit={{ rotateY: 82, x: 28, opacity: 0 }}
                        transition={{ duration: 0.34, ease: "easeInOut" }}
                        style={{ transformOrigin: "right center" }}
                      >
                        <div className="daily-archive-page__meta"><p className="eyebrow">READY TO POST</p><span>02 OF 02</span></div>
                        <ResultImageMaker avatar={avatar} entry={completed} compact/>
                        <button className="btn" onClick={() => setArchivePage(1)}>返回第一页</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.form key="question" className="daily-form" onSubmit={submit} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
                <p className="eyebrow">TODAY WEIRD QUESTION</p>
                <h2>{plainText(todayQuestion.prompt)}</h2>
                <div className="field">
                  <label className="sr-only" htmlFor="daily-answer">今天的回答</label>
                  <textarea id="daily-answer" className="textarea" maxLength={60} placeholder="一句话就好" value={answer} disabled={dailyAction !== "idle"} onChange={(event) => setAnswer(event.target.value)} />
                  <span className="field-meta"><span>提交后今天不能重答</span><span>{answer.length}/60</span></span>
                </div>
                <button className="btn btn--primary" disabled={!answer.trim() || dailyAction !== "idle"} type="submit">{dailyAction === "submitting" ? "正在消化" : "喂给它"} <Send size={18}/></button>
                <p className="privacy-note">没有连续签到 忘记回来时它只会继续待着</p>
              </motion.form>
            )}
          </AnimatePresence>
        </section>
      </div>
    </AppShell>
  );
}
