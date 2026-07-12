export type TraitKey = "energy" | "softness" | "order" | "social" | "oddness";

export type Traits = Record<TraitKey, number>;

export type QuestionCategory =
  | "absurd"
  | "social"
  | "preference"
  | "friction"
  | "imagination"
  | "reflection";

export interface DailyQuestion {
  id: string;
  category: QuestionCategory;
  prompt: string;
}

export interface AvatarParts {
  body: string;
  color?: "coral" | "blue" | "yellow" | "green" | "violet";
  eyes: string;
  mouth: string;
  head: string | null;
  back: string | null;
  textures: string[];
  handheld: string | null;
}

export interface TraitHighlight {
  key: TraitKey;
  label: string;
  value: number;
}

export interface PersonalityRead {
  title: string;
  description: string;
  highlights: TraitHighlight[];
}

export interface Avatar {
  id: string;
  name: string;
  seed: string;
  traits: Traits;
  parts: AvatarParts;
  mutationCount: number;
  rebuildUsed: boolean;
  createdAt: string;
}

export type MutationSlot = "head" | "back" | "texture" | "handheld";

export interface Mutation {
  id: string;
  date: string;
  slot: MutationSlot;
  token: string;
  label: string;
  previousToken: string | null;
}

export interface Sticker {
  id: string;
  kind: "daily" | "relationship";
  title: string;
  subtitle: string;
  date: string;
  tone: "coral" | "blue" | "yellow" | "green";
}

export interface DailyEntry {
  id: string;
  date: string;
  questionId: string;
  question: string;
  answer: string;
  response: string;
  traitDelta: Partial<Traits>;
  mutation: Mutation;
  sticker: Sticker;
}

export type GuestAction = "poke" | "feed" | "label";

export interface PublicAvatarSnapshot {
  avatarId: string;
  name: string;
  traits: Pick<Traits, "energy" | "softness" | "oddness">;
  parts: AvatarParts;
  mutationCount: number;
  publicLine: string;
  sticker: Sticker | null;
}

export interface ShareRecord {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  snapshot: PublicAvatarSnapshot;
}

export interface GuestInteraction {
  shareId: string;
  visitorId: string;
  action: GuestAction;
  response: string;
  sticker: Sticker;
  createdAt: string;
}

export interface AppState {
  version: 1;
  avatar: Avatar | null;
  entries: DailyEntry[];
  mutations: Mutation[];
  stickers: Sticker[];
  shares: ShareRecord[];
  guestInteractions: GuestInteraction[];
  questionHistory: Array<{ date: string; questionId: string }>;
  rerolls: Record<string, string>;
  theme: "system" | "light" | "dark";
}

export interface OnboardingAnswer {
  questionId: string;
  optionId: string;
}

export interface OnboardingInput {
  choices: OnboardingAnswer[];
  freeText: string;
}

export const EMPTY_STATE: AppState = {
  version: 1,
  avatar: null,
  entries: [],
  mutations: [],
  stickers: [],
  shares: [],
  guestInteractions: [],
  questionHistory: [],
  rerolls: {},
  theme: "light",
};
