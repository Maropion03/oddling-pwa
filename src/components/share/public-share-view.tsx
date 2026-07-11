"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Fingerprint, MousePointer2, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { Wordmark } from "@/components/brand/wordmark";
import { StickerCard } from "@/components/sticker/sticker-card";
import { useOddling } from "@/components/providers/oddling-provider";
import type { GuestAction, GuestInteraction, ShareRecord } from "@/lib/domain/types";
import { plainText } from "@/lib/text";

const actions: Array<{ id: GuestAction; label: string; note: string; icon: typeof MousePointer2 }> = [
  { id: "poke", label: "戳一下", note: "看看它会不会装没看见", icon: MousePointer2 },
  { id: "feed", label: "投喂怪东西", note: "来源不明但大概能吃", icon: Cookie },
  { id: "label", label: "贴个标签", note: "给它一个临时定义", icon: Fingerprint },
];

export function PublicShareView({ shareId }: { shareId: string }) {
  const { hydrated, cloudConfigured, findShare, interactWithShare } = useOddling();
  const [interaction, setInteraction] = useState<GuestInteraction | null>(null);
  const [remoteShare, setRemoteShare] = useState<ShareRecord | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<GuestAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const localShare = findShare(shareId);
  const share = localShare ?? remoteShare;

  useEffect(() => {
    if (!cloudConfigured || localShare) return;
    let cancelled = false;
    void (async () => {
      setRemoteLoading(true);
      const visitorId = window.localStorage.getItem("oddling:visitor:v1");
      const visitorQuery = visitorId ? `?visitorId=${encodeURIComponent(visitorId)}` : "";
      const response = await fetch(`/api/public/shares/${encodeURIComponent(shareId)}${visitorQuery}`);
      if (response.ok) {
        const body = await response.json() as { token: string; snapshot: ShareRecord["snapshot"]; createdAt: string; expiresAt?: string | null; interaction?: GuestInteraction | null };
        if (!cancelled) {
          setRemoteShare({ id: body.token, snapshot: body.snapshot, createdAt: body.createdAt, expiresAt: body.expiresAt ?? null });
          setInteraction(body.interaction ?? null);
        }
      }
      if (!cancelled) setRemoteLoading(false);
    })();
    return () => { cancelled = true; };
  }, [cloudConfigured, localShare, shareId]);

  if (!hydrated || remoteLoading) return <div className="loading-screen"><span className="loading-mark"/></div>;

  if (!share) {
    return (
      <main className="public-empty">
        <Wordmark compact />
        <div className="empty-state"><h1 className="page-title">这个分身溜走了</h1><p>分享可能过期 或者它根本不想被找到</p><Link className="btn btn--primary" href="/create">放出我自己的</Link></div>
      </main>
    );
  }

  const snapshot = share.snapshot;

  async function act(action: GuestAction) {
    if (pendingAction) return;
    setActionError(null);
    setPendingAction(action);
    try {
      if (localShare) {
        const result = await interactWithShare(shareId, action);
        if (!result) throw new Error("这次互动没有送达 请再试一次");
        setInteraction(result);
        return;
      }
      let visitorId = window.localStorage.getItem("oddling:visitor:v1");
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        window.localStorage.setItem("oddling:visitor:v1", visitorId);
      }
      const response = await fetch(`/api/public/shares/${encodeURIComponent(shareId)}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, action }),
      });
      if (!response.ok) throw new Error("这次互动没有送达 请再试一次");
      const body = await response.json() as { interaction: GuestInteraction };
      setInteraction(body.interaction);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "这次互动没有送达 请再试一次");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="public-share">
      <header className="public-share__nav"><Wordmark compact/><span className="status-strip"><span className="status-dot"/>好友分享 无需登录</span></header>
      <section className="public-stage">
        <p className="eyebrow">FRIEND ODDLING</p>
        <AvatarFigure parts={snapshot.parts} name={snapshot.name}/>
        <div className="public-name"><span>它叫</span><h1>{snapshot.name}</h1><p>{plainText(snapshot.publicLine)}</p></div>
        {snapshot.sticker && <div className="public-sticker"><StickerCard sticker={snapshot.sticker} compact/></div>}
      </section>
      <section className="guest-action">
        <AnimatePresence mode="wait" initial={!reduceMotion}>
        {interaction ? (
          <motion.div key="result" className="guest-result" initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.32, ease: "easeOut" }}>
            <p className="eyebrow">IT RESPONDED</p>
            <h2>{plainText(interaction.response)}</h2>
            <StickerCard sticker={interaction.sticker}/>
            <p className="privacy-note">这次互动不会改变好友分身的永久属性</p>
            <Link className="btn btn--primary" href="/create"><Sparkles size={18}/>我也放一个出来</Link>
          </motion.div>
        ) : (
          <motion.div key="choice" className="guest-choice" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.26, ease: "easeOut" }}>
            <p className="eyebrow">CHOOSE ONE THING</p>
            <h2>你想对它做什么</h2>
            <p className="lede">每位访客只能选一次 它会自己决定怎么回应</p>
            <div className="guest-action-list" aria-busy={Boolean(pendingAction)}>
              {actions.map((action, index) => {
                const Icon = action.icon;
                const isPending = pendingAction === action.id;
                const isMuted = Boolean(pendingAction) && !isPending;
                const iconMotion = action.id === "poke"
                  ? { x: [0, -5, 4, -2, 0], rotate: [0, -10, 8, -4, 0] }
                  : action.id === "feed"
                    ? { y: [0, 6, -2, 0], rotate: [0, -8, 6, 0] }
                    : { rotate: [0, -14, 10, -4, 0], scale: [1, 1.16, 0.96, 1] };
                return (
                  <motion.button
                    key={action.id}
                    className={isPending ? "is-pending" : undefined}
                    type="button"
                    disabled={Boolean(pendingAction)}
                    onClick={() => void act(action.id)}
                    initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                    animate={isPending && !reduceMotion
                      ? { opacity: 1, x: [0, -4, 3, 0], scale: [1, 1.025, 0.99, 1] }
                      : isMuted ? { opacity: 0.36, x: 14, scale: 0.98 } : { opacity: 1, x: 0, scale: 1 }}
                    transition={isPending ? { duration: 0.42, ease: "easeInOut" } : { duration: 0.28, delay: reduceMotion ? 0 : index * 0.08, ease: "easeOut" }}
                    whileHover={reduceMotion || pendingAction ? undefined : { x: 8 }}
                    whileTap={reduceMotion || pendingAction ? undefined : { scale: 0.985 }}
                  >
                    <motion.span className="guest-action__icon" animate={isPending && !reduceMotion ? iconMotion : { x: 0, y: 0, rotate: 0, scale: 1 }} transition={{ duration: 0.42, ease: "easeInOut" }}><Icon/></motion.span>
                    <span className="guest-action__copy"><strong>{isPending ? "它正在决定" : action.label}</strong><small>{action.note}</small></span>
                  </motion.button>
                );
              })}
            </div>
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
          </motion.div>
        )}
        </AnimatePresence>
      </section>
    </main>
  );
}
