import { clsx } from "clsx";
import type { Sticker } from "@/lib/domain/types";
import { compactDate, plainText } from "@/lib/text";

export function StickerCard({ sticker, compact = false }: { sticker: Sticker; compact?: boolean }) {
  return (
    <article className={clsx("sticker", `sticker--${sticker.tone}`, compact && "sticker--compact")}> 
      <span className="sticker__kicker">{sticker.kind === "daily" ? "DAILY DROP" : "RELATIONSHIP"}</span>
      <strong>{plainText(sticker.title)}</strong>
      <span>{plainText(sticker.subtitle)}</span>
      <time dateTime={sticker.date}>{compactDate(sticker.date)}</time>
    </article>
  );
}
