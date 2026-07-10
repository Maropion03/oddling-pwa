"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/navigation/app-shell";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { StickerCard } from "@/components/sticker/sticker-card";
import { useOddling } from "@/components/providers/oddling-provider";

type Tab = "mutations" | "stickers" | "relations";

export function AlbumView() {
  const router = useRouter();
  const { state, hydrated } = useOddling();
  const [tab, setTab] = useState<Tab>("mutations");
  const avatar = state.avatar;

  useEffect(() => {
    if (hydrated && !avatar) router.replace("/create");
  }, [avatar, hydrated, router]);

  if (!hydrated || !avatar) return <div className="loading-screen"><span className="loading-mark"/></div>;

  const relationshipStickers = state.stickers.filter((sticker) => sticker.kind === "relationship");

  return (
    <AppShell>
      <div className="page-wrap album-page">
        <header className="page-head">
          <div className="page-head__copy"><p className="eyebrow">ARCHIVE OF SMALL CHANGES</p><h1 className="page-title">贴纸册</h1></div>
          <span className="status-strip"><span className="status-dot"/>{state.mutations.length} 次变异 · {state.stickers.length} 张贴纸</span>
        </header>

        <div className="album-tabs" role="tablist" aria-label="收藏分类">
          <button role="tab" aria-selected={tab === "mutations"} onClick={() => setTab("mutations")}>变异谱 <span>{state.mutations.length}</span></button>
          <button role="tab" aria-selected={tab === "stickers"} onClick={() => setTab("stickers")}>每日贴纸 <span>{state.stickers.filter((item) => item.kind === "daily").length}</span></button>
          <button role="tab" aria-selected={tab === "relations"} onClick={() => setTab("relations")}>关系事件 <span>{relationshipStickers.length}</span></button>
        </div>

        {tab === "mutations" && (
          state.mutations.length ? (
            <ol className="mutation-history">
              {[...state.mutations].reverse().map((mutation, index) => (
                <li key={mutation.id}>
                  <span className="mutation-history__index">{String(state.mutations.length - index).padStart(2, "0")}</span>
                  <AvatarFigure parts={avatar.parts} name={avatar.name} size="small" animated={false}/>
                  <div><time>{mutation.date.replaceAll("-", ".")}</time><strong>{mutation.label}</strong><p>{mutation.previousToken ? "替换了之前的同槽位部件" : "永久留在了角色身上"}</p></div>
                  <span className="mutation-history__slot">{mutation.slot}</span>
                </li>
              ))}
            </ol>
          ) : <div className="empty-state"><p>第一次回答每日问题后，<br/>这里会出现一条真实的变化。</p></div>
        )}

        {tab === "stickers" && (
          <div className="sticker-grid">
            {[...state.stickers].filter((item) => item.kind === "daily").reverse().map((sticker) => <StickerCard key={sticker.id} sticker={sticker}/>) }
            {!state.stickers.some((item) => item.kind === "daily") && <div className="empty-state"><p>贴纸册还是空的。<br/>它正在等今天那句话。</p></div>}
          </div>
        )}

        {tab === "relations" && (
          <div className="sticker-grid">
            {[...relationshipStickers].reverse().map((sticker) => <StickerCard key={sticker.id} sticker={sticker}/>) }
            {!relationshipStickers.length && <div className="empty-state"><p>还没有人和它发生关系事件。<br/>分享一次，就可能掉落第一张。</p></div>}
          </div>
        )}
      </div>
    </AppShell>
  );
}
