"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Fingerprint, MousePointer2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { Wordmark } from "@/components/brand/wordmark";
import { StickerCard } from "@/components/sticker/sticker-card";
import { useOddling } from "@/components/providers/oddling-provider";
import type { GuestAction, GuestInteraction, ShareRecord } from "@/lib/domain/types";

const actions: Array<{ id: GuestAction; label: string; note: string; icon: typeof MousePointer2 }> = [
  { id: "poke", label: "戳一下", note: "看看它会不会装没看见", icon: MousePointer2 },
  { id: "feed", label: "投喂怪东西", note: "来源不明，但大概能吃", icon: Cookie },
  { id: "label", label: "贴个标签", note: "给它一个临时定义", icon: Fingerprint },
];

export function PublicShareView({ shareId }: { shareId: string }) {
  const { hydrated, cloudConfigured, findShare, interactWithShare } = useOddling();
  const [interaction, setInteraction] = useState<GuestInteraction | null>(null);
  const [remoteShare, setRemoteShare] = useState<ShareRecord | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const localShare = findShare(shareId);
  const share = localShare ?? remoteShare;

  useEffect(() => {
    if (!cloudConfigured || localShare) return;
    let cancelled = false;
    void (async () => {
      setRemoteLoading(true);
      const response = await fetch(`/api/public/shares/${encodeURIComponent(shareId)}`);
      if (response.ok) {
        const body = await response.json() as { token: string; snapshot: ShareRecord["snapshot"]; createdAt: string };
        if (!cancelled) setRemoteShare({ id: body.token, snapshot: body.snapshot, createdAt: body.createdAt });
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
        <div className="empty-state"><h1 className="page-title">这个分身溜走了</h1><p>分享可能过期，或者它根本不想被找到。</p><Link className="btn btn--primary" href="/create">放出我自己的</Link></div>
      </main>
    );
  }

  const snapshot = share.snapshot;

  async function act(action: GuestAction) {
    if (localShare) {
      const result = await interactWithShare(shareId, action);
      if (result) setInteraction(result);
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
    if (!response.ok) return;
    const body = await response.json() as { interaction: GuestInteraction };
    setInteraction(body.interaction);
  }

  return (
    <main className="public-share">
      <header className="public-share__nav"><Wordmark compact/><span className="status-strip"><span className="status-dot"/>好友分享 · 无需登录</span></header>
      <section className="public-stage">
        <p className="eyebrow">A FRIEND&apos;S ODDLING</p>
        <AvatarFigure parts={snapshot.parts} name={snapshot.name}/>
        <div className="public-name"><span>它叫</span><h1>{snapshot.name}</h1><p>{snapshot.publicLine}</p></div>
        {snapshot.sticker && <div className="public-sticker"><StickerCard sticker={snapshot.sticker} compact/></div>}
      </section>
      <section className="guest-action">
        {interaction ? (
          <motion.div className="guest-result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow">IT RESPONDED</p>
            <h2>{interaction.response}</h2>
            <StickerCard sticker={interaction.sticker}/>
            <p className="privacy-note">这次互动不会改变好友分身的永久属性。</p>
            <Link className="btn btn--primary" href="/create"><Sparkles size={18}/>我也放一个出来</Link>
          </motion.div>
        ) : (
          <div className="guest-choice">
            <p className="eyebrow">CHOOSE ONE THING</p>
            <h2>你想对它做什么？</h2>
            <p className="lede">每位访客只能选一次。它会自己决定怎么回应。</p>
            <div className="guest-action-list">
              {actions.map((action) => { const Icon = action.icon; return <button key={action.id} onClick={() => void act(action.id)}><Icon/><span><strong>{action.label}</strong><small>{action.note}</small></span></button>; })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
