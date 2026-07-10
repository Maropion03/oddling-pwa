import type { Metadata } from "next";
import { PublicShareView } from "@/components/share/public-share-view";

export const metadata: Metadata = { title: "有人把分身放出来了" };

export default async function PublicSharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  return <PublicShareView shareId={shareId}/>;
}
