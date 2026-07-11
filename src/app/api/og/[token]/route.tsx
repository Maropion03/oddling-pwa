import { ImageResponse } from "next/og";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sharePresentation, ogAvatarDataUrl } from "@/lib/share-presentation";
import { snapshotFromRow } from "@/lib/supabase/mappers";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) return new Response("Unavailable", { status: 503 });
  const { data } = await admin.from("shares").select("public_snapshot,expires_at").eq("public_token", token).maybeSingle();
  if (!data || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) return new Response("Not found", { status: 404 });
  const snapshot = snapshotFromRow(data.public_snapshot);
  const presentation = sharePresentation(snapshot);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden", background: "#F3EEDC", color: "#202124", fontFamily: "sans-serif" }}>
        <div style={{ width: "55%", display: "flex", flexDirection: "column", padding: "64px 0 64px 72px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>● ODDLING <span style={{ color: "#FF6F59", marginLeft: 8 }}>↘</span></div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#D94E3F", fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>FRIEND ODDLING</div>
            <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: -5, lineHeight: 1.05, marginTop: 16 }}>{presentation.title}</div>
            <div style={{ fontSize: 30, lineHeight: 1.4, marginTop: 26 }}>{presentation.description}</div>
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 800, padding: "12px 18px", border: "3px solid #202124", borderRadius: 999, alignSelf: "flex-start", background: "#FFD166" }}>怪可爱分身养成玩具</div>
        </div>
        <div style={{ width: "45%", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#FF6F59", borderLeft: "5px solid #202124" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a data URL image. */}
          <img alt="" src={ogAvatarDataUrl(snapshot)} width="430" height="430" style={{ filter: "drop-shadow(16px 18px 0 rgba(32,33,36,.22))" }}/>
          <div style={{ position: "absolute", right: 42, bottom: 42, padding: "12px 16px", border: "3px solid #202124", borderRadius: 18, background: "#F3EEDC", fontSize: 24, fontWeight: 900 }}>{snapshot.name}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
