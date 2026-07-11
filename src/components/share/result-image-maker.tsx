"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Download, ImageIcon, RectangleVertical, Square } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toPng } from "html-to-image";
import { AvatarFigure } from "@/components/avatar/avatar-figure";
import { getPersonalityRead } from "@/lib/domain/engine";
import type { Avatar, DailyEntry } from "@/lib/domain/types";

type Format = "portrait" | "square";

const EXPORT_COLOR_TOKENS = {
  "--paper": "#f3eedc",
  "--paper-deep": "#e9e0c5",
  "--ink": "#202124",
  "--ink-soft": "#55564f",
  "--coral": "#ff6f59",
  "--blue": "#2b59c3",
  "--yellow": "#f3cb42",
  "--green": "#d2ff45",
  "--white": "#fffdf4",
} as CSSProperties;

const flipVariants = {
  enter: { rotateY: 90, opacity: 0, scale: 0.92 },
  center: { rotateY: 0, opacity: 1, scale: 1 },
  exit: { rotateY: -90, opacity: 0, scale: 0.92 },
};

export function ResultImageMaker({ avatar, entry }: { avatar: Avatar; entry?: DailyEntry | null }) {
  const [format, setFormat] = useState<Format>("portrait");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const cardRef = useRef<HTMLDivElement>(null);
  const personality = getPersonalityRead(avatar.traits);
  const isDaily = Boolean(entry);

  async function save() {
    if (!cardRef.current) return;
    setStatus("saving");
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#f3eedc",
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `oddling-${isDaily ? "daily" : "birth"}-${format}.png`;
      link.href = dataUrl;
      link.click();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="result-image-maker" aria-label="保存分享结果图">
      <div className="result-image-maker__top">
        <div><p className="eyebrow">READY TO POST</p><h2>{isDaily ? "把今天的变异带走" : "把第一次见面带走"}</h2></div>
        <div className="result-format-switch" role="group" aria-label="结果图尺寸">
          <button type="button" aria-pressed={format === "portrait"} onClick={() => setFormat("portrait")}><RectangleVertical size={16}/>3:4</button>
          <button type="button" aria-pressed={format === "square"} onClick={() => setFormat("square")}><Square size={16}/>1:1</button>
        </div>
      </div>

      <div className="result-share-card__flipper">
        <AnimatePresence mode="sync">
          <motion.div
            key={format}
            ref={cardRef}
            className={`result-share-card result-share-card--${format}`}
            style={{ ...EXPORT_COLOR_TOKENS, backfaceVisibility: "hidden", gridArea: "1 / 1" }}
            variants={flipVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            <div className="result-share-card__brand"><span className="result-share-card__eye">•</span>ODDLING<span>↘</span></div>
            <p className="result-share-card__kicker">{isDaily ? `DAY ${String(avatar.mutationCount).padStart(2, "0")}` : "SPECIMEN FOUND"}</p>
            <AvatarFigure parts={avatar.parts} name={avatar.name} size="medium" animated={false}/>
            <div className="result-share-card__copy">
              <p className="result-share-card__name">{avatar.name}</p>
              {isDaily && entry ? (
                <><p className="result-share-card__line">{entry.response}</p><strong>{entry.mutation.label}</strong><span>{entry.sticker.title} · {entry.sticker.subtitle}</span></>
              ) : (
                <><strong>{personality.title}</strong><p className="result-share-card__line">{personality.description}</p><div className="result-share-card__traits">{personality.highlights.map((trait) => <span key={trait.key}>{trait.label} {trait.value}</span>)}</div></>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="result-image-maker__actions">
        <button type="button" className="btn btn--primary" onClick={() => void save()} disabled={status === "saving"}><Download size={18}/>{status === "saving" ? "正在导出" : status === "saved" ? "已保存" : "保存图片"}</button>
        {status === "error" && <p className="form-error" role="alert"><ImageIcon size={16}/>图片生成失败，请重试。</p>}
      </div>
    </section>
  );
}
