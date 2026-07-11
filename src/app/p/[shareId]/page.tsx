import type { Metadata } from "next";
import { PublicShareView } from "@/components/share/public-share-view";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { snapshotFromRow } from "@/lib/supabase/mappers";
import { sharePresentation } from "@/lib/share-presentation";

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) return { title: "有人把分身放出来了" };
  const { data } = await admin.from("shares").select("public_snapshot,expires_at").eq("public_token", shareId).maybeSingle();
  if (!data || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) return { title: "这个分身溜走了" };
  const presentation = sharePresentation(snapshotFromRow(data.public_snapshot));
  const image = `/api/og/${shareId}`;
  return {
    title: presentation.title,
    description: presentation.description,
    openGraph: { title: presentation.title, description: presentation.description, images: [{ url: image, width: 1200, height: 630, alt: `${presentation.title} Oddling` }] },
    twitter: { card: "summary_large_image", title: presentation.title, description: presentation.description, images: [image] },
  };
}

export default async function PublicSharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  return <PublicShareView shareId={shareId}/>;
}
