import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";

export const metadata = { title: "暂时离线" };

export default function OfflinePage() {
  return (
    <main className="loading-screen">
      <section className="empty-state" style={{ maxWidth: 520, margin: 20 }}>
        <WifiOff size={44} aria-hidden="true" />
        <Wordmark compact />
        <h1 className="page-title">信号被分身吃掉了</h1>
        <p className="lede">应用外壳仍然在。恢复网络后，再回来回答今天的怪问题。</p>
        <Link className="btn btn--primary" href="/home">重新看看</Link>
      </section>
    </main>
  );
}
