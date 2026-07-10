import { clsx } from "clsx";
import type { Sticker } from "@/lib/domain/types";

export function StickerCard({ sticker, compact = false }: { sticker: Sticker; compact?: boolean }) {
  return (
    <article className={clsx("sticker", `sticker--${sticker.tone}`, compact && "sticker--compact")}> 
      <span className="sticker__kicker">{sticker.kind === "daily" ? "DAILY DROP" : "RELATIONSHIP"}</span>
      <strong>{sticker.title}</strong>
      <span>{sticker.subtitle}</span>
      <time dateTime={sticker.date}>{sticker.date.replaceAll("-", ".")}</time>
    </article>
  );
}
