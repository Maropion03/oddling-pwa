import type { Metadata } from "next";
import { CreateFlow } from "@/components/create/create-flow";

export const metadata: Metadata = { title: "放出你的分身" };

export default function CreatePage() {
  return <CreateFlow />;
}
