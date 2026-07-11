"use client";

import { useEffect, useState, type FormEvent } from "react";
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

type InteractionGesture = { action: GuestAction; labelText?: string };

function HandShape({ action }: { action: GuestAction }) {
  return (
    <div className={`interaction-hand interaction-hand--${action}`} aria-hidden="true">
      <span className="interaction-hand__palm"/>
      <span className="interaction-hand__finger interaction-hand__finger--one"/>
      <span className="interaction-hand__finger interaction-hand__finger--two"/>
      <span className="interaction-hand__finger interaction-hand__finger--three"/>
    </div>
  );
}

function InteractionOverlay({ gesture, reduceMotion }: { gesture: InteractionGesture; reduceMotion: boolean | null }) {
  const isPoke = gesture.action === "poke";
  const isFeed = gesture.action === "feed";
  const handAnimation = isPoke
    ? { x: [290, 88, 46, 142], y: [54, 2, 6, 30], rotate: [24, -14, -14, 0] }
    : isFeed
      ? { x: [320, 122, 54, 152], y: [166, 56, 44, 82], rotate: [16, -12, -12, 0] }
      : { x: [300, 128, 78, 174], y: [-176, -68, -44, -6], rotate: [24, -8, -8, 0] };

  return (
    <motion.div className="interaction-overlay" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} aria-label="正在进行好友互动" role="status">
      <motion.div
        className="interaction-overlay__hand"
        initial={reduceMotion ? false : { x: handAnimation.x[0], y: handAnimation.y[0], rotate: handAnimation.rotate[0] }}
        animate={reduceMotion ? { x: 70, y: 4, rotate: 0 } : handAnimation}
        transition={{ duration: reduceMotion ? 0 : 0.95, times: [0, 0.45, 0.62, 1], ease: "easeInOut" }}
      >
        <HandShape action={gesture.action}/>
      </motion.div>
      {isPoke && <motion.span className="interaction-impact interaction-impact--poke" initial={reduceMotion ? false : { scale: 0, opacity: 0 }} animate={{ scale: [0, 1.25, 0.9], opacity: [0, 1, 0] }} transition={{ delay: 0.4, duration: 0.34 }}>碰</motion.span>}
      {isFeed && <motion.div className="interaction-snack" initial={reduceMotion ? false : { x: 248, y: 86, scale: 0.6, rotate: -20 }} animate={reduceMotion ? { x: 26, y: 22, scale: 1, rotate: 0 } : { x: [248, 98, 36, 4], y: [86, 38, 20, 12], scale: [0.6, 1, 0.86, 0], rotate: [-20, 8, 0, 18] }} transition={{ duration: reduceMotion ? 0 : 0.8, times: [0, 0.54, 0.72, 1], ease: "easeInOut" }}><Cookie size={38}/></motion.div>}
      {!isPoke && !isFeed && <motion.div className="interaction-label-sticker" initial={reduceMotion ? false : { x: 260, y: -148, rotate: 18, scale: 0.7, opacity: 0 }} animate={reduceMotion ? { x: 18, y: -26, rotate: -4, scale: 1, opacity: 1 } : { x: [260, 86, 18], y: [-148, -64, -26], rotate: [18, -10, -4], scale: [0.7, 1.12, 1], opacity: [0, 1, 1] }} transition={{ duration: reduceMotion ? 0 : 0.72, times: [0, 0.68, 1], ease: "easeOut" }}><span>临时定义</span><strong>{gesture.labelText}</strong></motion.div>}
    </motion.div>
  );
}

function LabelDialog({ value, onChange, onCancel, onConfirm, reduceMotion }: { value: string; onChange: (value: string) => void; onCancel: () => void; onConfirm: (event: FormEvent<HTMLFormElement>) => void; reduceMotion: boolean | null }) {
  return (
    <motion.div className="label-dialog" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="label-dialog-title">
      <button className="label-dialog__scrim" type="button" aria-label="关闭标签输入" onClick={onCancel}/>
      <motion.form className="label-dialog__card" initial={reduceMotion ? false : { opacity: 0, y: 24, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: -1 }} exit={reduceMotion ? undefined : { opacity: 0, y: 16 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} onSubmit={onConfirm}>
        <p className="eyebrow">TEMPORARY LABEL</p>
        <h2 id="label-dialog-title">给它一个临时定义</h2>
        <label htmlFor="guest-label">写在贴纸上</label>
        <input id="guest-label" className="input" maxLength={12} autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="例如 很会等" />
        <span className="field-meta"><span>它会把这句话收进贴纸</span><span>{value.length} 共 12</span></span>
        <div className="label-dialog__actions"><button className="btn btn--ghost" type="button" onClick={onCancel}>算了</button><button className="btn btn--primary" type="submit" disabled={!value.trim()}>贴上去</button></div>
      </motion.form>
    </motion.div>
  );
}

export function PublicShareView({ shareId }: { shareId: string }) {
  const { hydrated, cloudConfigured, findShare, interactWithShare } = useOddling();
  const [interaction, setInteraction] = useState<GuestInteraction | null>(null);
  const [remoteShare, setRemoteShare] = useState<ShareRecord | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<GuestAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [gesture, setGesture] = useState<InteractionGesture | null>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
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

  async function requestInteraction(action: GuestAction, labelText?: string) {
    if (localShare) return interactWithShare(shareId, action, labelText);
    let visitorId = window.localStorage.getItem("oddling:visitor:v1");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      window.localStorage.setItem("oddling:visitor:v1", visitorId);
    }
    const response = await fetch(`/api/public/shares/${encodeURIComponent(shareId)}/interact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, action, ...(labelText ? { labelText } : {}) }),
    });
    if (!response.ok) throw new Error("这次互动没有送达 请再试一次");
    const body = await response.json() as { interaction: GuestInteraction };
    return body.interaction;
  }

  function act(action: GuestAction, labelText?: string) {
    if (pendingAction) return;
    setActionError(null);
    setPendingAction(action);
    setGesture({ action, labelText });
    void (async () => {
      try {
        const resultPromise = requestInteraction(action, labelText);
        if (!reduceMotion) await new Promise((resolve) => window.setTimeout(resolve, 950));
        const result = await resultPromise;
        if (!result) throw new Error("这次互动没有送达 请再试一次");
        setInteraction(result);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "这次互动没有送达 请再试一次");
      } finally {
        setGesture(null);
        setPendingAction(null);
      }
    })();
  }

  function chooseAction(action: GuestAction) {
    if (action === "label") {
      setLabelDialogOpen(true);
      return;
    }
    act(action);
  }

  function submitLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const labelText = plainText(labelDraft).slice(0, 12);
    if (!labelText) return;
    setLabelDialogOpen(false);
    setLabelDraft(labelText);
    act("label", labelText);
  }

  return (
    <main className="public-share">
      <header className="public-share__nav"><Wordmark compact/><span className="status-strip"><span className="status-dot"/>好友分享 无需登录</span></header>
      <section className="public-stage">
        <p className="eyebrow">FRIEND ODDLING</p>
        <AvatarFigure parts={snapshot.parts} name={snapshot.name}/>
        {gesture && <InteractionOverlay gesture={gesture} reduceMotion={reduceMotion}/>}
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
                    onClick={() => chooseAction(action.id)}
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
      <AnimatePresence>{labelDialogOpen && <LabelDialog value={labelDraft} onChange={setLabelDraft} onCancel={() => setLabelDialogOpen(false)} onConfirm={submitLabel} reduceMotion={reduceMotion}/>}</AnimatePresence>
    </main>
  );
}
