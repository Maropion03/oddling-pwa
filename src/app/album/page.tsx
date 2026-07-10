import type { Metadata } from "next";
import { AlbumView } from "@/components/album/album-view";

export const metadata: Metadata = { title: "贴纸册" };

export default function AlbumPage() {
  return <AlbumView />;
}
