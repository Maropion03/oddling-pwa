import type { Metadata } from "next";
import { MeView } from "@/components/me/me-view";

export const metadata: Metadata = { title: "我的" };

export default function MePage() {
  return <MeView />;
}
