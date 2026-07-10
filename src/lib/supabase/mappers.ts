import type { Avatar, AvatarParts, PublicAvatarSnapshot, Sticker, Traits } from "@/lib/domain/types";

export function avatarFromRow(row: Record<string, unknown>): Avatar {
  return {
    id: String(row.id),
    name: String(row.name),
    seed: String(row.seed),
    traits: row.traits as Traits,
    parts: row.parts as AvatarParts,
    mutationCount: Number(row.mutation_count ?? 0),
    rebuildUsed: Boolean(row.rebuild_used),
    createdAt: String(row.created_at),
  };
}

export function stickerFromRow(row: Record<string, unknown>): Sticker {
  const payload = row.payload as Partial<Sticker> | null;
  return {
    id: String(row.id),
    kind: row.kind === "relationship" ? "relationship" : "daily",
    title: String(row.title),
    subtitle: String(payload?.subtitle ?? "一次小变化"),
    date: String(payload?.date ?? String(row.created_at).slice(0, 10)),
    tone: payload?.tone ?? "yellow",
  };
}

export function snapshotFromRow(value: unknown): PublicAvatarSnapshot {
  return value as PublicAvatarSnapshot;
}
