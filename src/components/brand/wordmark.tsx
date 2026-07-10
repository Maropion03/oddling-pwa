import Link from "next/link";
import { clsx } from "clsx";

export function Wordmark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={clsx("wordmark", compact && "wordmark--compact", inverse && "wordmark--inverse")}
      aria-label="Oddling 首页"
    >
      <span aria-hidden="true" className="wordmark__eye">•</span>
      ODDLING
      <span aria-hidden="true" className="wordmark__tail">↘</span>
    </Link>
  );
}
