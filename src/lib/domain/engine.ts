import { DAILY_QUESTIONS } from "./questions";
import type {
  Avatar,
  AvatarParts,
  DailyEntry,
  DailyQuestion,
  GuestAction,
  GuestInteraction,
  Mutation,
  MutationSlot,
  OnboardingInput,
  PublicAvatarSnapshot,
  ShareRecord,
  Sticker,
  TraitKey,
  Traits,
} from "./types";

const TRAIT_KEYS: TraitKey[] = ["energy", "softness", "order", "social", "oddness"];
const BODY = ["bean", "pear", "cloud", "drop", "pebble"];
const EYES = ["dot", "sleepy", "wide", "spark", "side", "mismatch", "line", "moon"];
const MOUTHS = ["smile", "flat", "o", "fang", "wave", "tiny"];
const HEAD = ["sprout", "antenna", "paper-crown", "tiny-cloud", "ribbon", "satellite"];
const BACK = ["fin", "wings", "shell", "flag", "tail", "shadow"];
const TEXTURES = ["freckles", "stripes", "dots", "patch", "stars", "scribble"];
const HANDHELD = ["spoon", "key", "flower", "lamp", "tiny-flag", "snack"];

export const MUTATION_TOKENS = {
  head: HEAD,
  back: BACK,
  texture: TEXTURES,
  handheld: HANDHELD,
} satisfies Record<MutationSlot, string[]>;

const MUTATION_LABELS: Record<string, string> = {
  sprout: "偷偷长高的芽",
  antenna: "接收杂音的天线",
  "paper-crown": "临时国王纸冠",
  "tiny-cloud": "随身阴天",
  ribbon: "不肯打正的结",
  satellite: "低功率卫星",
  fin: "逃跑备用鳍",
  wings: "犹豫型小翅膀",
  shell: "请稍后再说壳",
  flag: "随时投降旗",
  tail: "意见很多的尾巴",
  shadow: "多带了一片影子",
  freckles: "晒不到的雀斑",
  stripes: "秩序感条纹",
  dots: "随机小点",
  patch: "修补过的勇气",
  stars: "低调星屑",
  scribble: "脑内涂鸦",
  spoon: "备用小勺",
  key: "无门可开钥匙",
  flower: "不合时宜的花",
  lamp: "尴尬感应灯",
  "tiny-flag": "微型态度旗",
  snack: "紧急小零食",
};

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function localDate(date = new Date(), timezone?: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

const clampTrait = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const clampInitialTrait = (value: number) => Math.max(25, Math.min(75, Math.round(value)));

function pick<T>(items: readonly T[], seed: number, offset = 0): T {
  return items[(seed + offset * 7919) % items.length];
}

export function generateAvatar(input: OnboardingInput, now = new Date()): Avatar {
  const answerKey = input.choices.map((item) => `${item.questionId}:${item.optionId}`).join("|");
  const seedText = `${answerKey}|${input.freeText.trim().toLowerCase()}`;
  const seed = hashString(seedText);
  const traits: Traits = {
    energy: 25 + (hashString(`${seedText}:energy`) % 51),
    softness: 25 + (hashString(`${seedText}:softness`) % 51),
    order: 25 + (hashString(`${seedText}:order`) % 51),
    social: 25 + (hashString(`${seedText}:social`) % 51),
    oddness: 25 + (hashString(`${seedText}:oddness`) % 51),
  };

  for (const choice of input.choices) {
    if (["puddle", "reply", "lamp"].includes(choice.optionId)) traits.energy = clampInitialTrait(traits.energy + 8);
    if (["blanket", "listen", "seed"].includes(choice.optionId)) traits.softness = clampInitialTrait(traits.softness + 8);
    if (["roof", "archive", "key"].includes(choice.optionId)) traits.order = clampInitialTrait(traits.order + 8);
    if (["reply", "lamp"].includes(choice.optionId)) traits.social = clampInitialTrait(traits.social + 8);
    if (["puddle", "key", "seed"].includes(choice.optionId)) traits.oddness = clampInitialTrait(traits.oddness + 8);
  }

  const parts: AvatarParts = {
    body: pick(BODY, seed),
    eyes: pick(EYES, seed, 1),
    mouth: pick(MOUTHS, seed, 2),
    head: null,
    back: null,
    textures: [pick(TEXTURES, seed, 3)],
    handheld: null,
  };

  return {
    id: crypto.randomUUID(),
    name: pick(["泡芙", "团子", "不明", "歪歪", "某某", "点点"], seed, 4),
    seed: seed.toString(36),
    traits,
    parts,
    mutationCount: 0,
    rebuildUsed: false,
    createdAt: now.toISOString(),
  };
}

export function selectDailyQuestion(options: {
  avatarSeed: string;
  date: string;
  history: Array<{ date: string; questionId: string }>;
  excludeId?: string;
}): DailyQuestion {
  const recentIds = new Set(options.history.slice(-30).map((item) => item.questionId));
  const recentCategories = options.history
    .slice(-2)
    .map((item) => DAILY_QUESTIONS.find((question) => question.id === item.questionId)?.category)
    .filter(Boolean);
  const blockedCategory =
    recentCategories.length === 2 && recentCategories[0] === recentCategories[1]
      ? recentCategories[0]
      : null;
  const available = DAILY_QUESTIONS.filter(
    (question) =>
      !recentIds.has(question.id) &&
      question.id !== options.excludeId &&
      question.category !== blockedCategory,
  );
  const fallback = DAILY_QUESTIONS.filter((question) => question.id !== options.excludeId);
  const pool = available.length > 0 ? available : fallback;
  return pick(pool, hashString(`${options.avatarSeed}:${options.date}:${options.excludeId ?? "first"}`));
}

function deriveDelta(answer: string, question: DailyQuestion): Partial<Traits> {
  const normalized = answer.trim();
  const seed = hashString(`${question.id}:${normalized}`);
  const first = TRAIT_KEYS[seed % TRAIT_KEYS.length];
  const second = TRAIT_KEYS[(seed + 2) % TRAIT_KEYS.length];
  const direction = normalized.length % 2 === 0 ? 1 : -1;
  const categoryBias: Partial<Record<DailyQuestion["category"], TraitKey>> = {
    absurd: "oddness",
    social: "social",
    preference: "order",
    friction: "softness",
    imagination: "energy",
    reflection: "softness",
  };
  const biased = categoryBias[question.category] ?? first;
  return {
    [biased]: Math.max(-5, Math.min(5, direction * (2 + (seed % 4)))),
    [second]: Math.max(-5, Math.min(5, -direction * (1 + ((seed >> 3) % 3)))),
  };
}

function mutationPool(slot: MutationSlot): string[] {
  return MUTATION_TOKENS[slot];
}

export function isValidMutationToken(slot: MutationSlot, token: string): boolean {
  return MUTATION_TOKENS[slot].includes(token);
}

export function mutationLabel(token: string): string {
  return MUTATION_LABELS[token] ?? "无法命名的小变化";
}

function chooseMutation(avatar: Avatar, answer: string, date: string): Mutation {
  const slots: MutationSlot[] = ["head", "back", "texture", "handheld"];
  const seed = hashString(`${avatar.seed}:${answer}:${date}:${avatar.mutationCount}`);
  const slot = pick(slots, seed);
  const pool = mutationPool(slot);
  const current = slot === "texture" ? avatar.parts.textures : [avatar.parts[slot]];
  const available = pool.filter((token) => !current.includes(token));
  const token = pick(available.length > 0 ? available : pool, seed, 1);
  const previousToken = slot === "texture" ? null : avatar.parts[slot];
  return {
    id: crypto.randomUUID(),
    date,
    slot,
    token,
    label: mutationLabel(token),
    previousToken,
  };
}

export function applyMutation(avatar: Avatar, mutation: Mutation): Avatar {
  const parts: AvatarParts = { ...avatar.parts, textures: [...avatar.parts.textures] };
  if (mutation.slot === "texture") {
    parts.textures = [...parts.textures.filter((token) => token !== mutation.token), mutation.token].slice(-2);
  } else {
    parts[mutation.slot] = mutation.token;
  }
  return { ...avatar, parts, mutationCount: avatar.mutationCount + 1 };
}

function responseFor(avatar: Avatar, mutation: Mutation, answer: string): string {
  const templates = avatar.traits.oddness > 58
    ? [
        `收到。${mutation.label}已经擅自开始工作。`,
        `这个答案有点响，我长出了${mutation.label}。`,
        `先别解释，${mutation.label}说它都懂。`,
      ]
    : avatar.traits.softness > 58
      ? [
          `我把这句话收好了，也把${mutation.label}留下。`,
          `今天不用急，${mutation.label}会陪我们慢一点。`,
          `听见了。这里刚好多出一个${mutation.label}。`,
        ]
      : [
          `记录完毕。副作用是${mutation.label}。`,
          `答案有效，${mutation.label}已到账。`,
          `好。今天就用${mutation.label}处理这件事。`,
        ];
  return pick(templates, hashString(`${avatar.seed}:${answer}`));
}

function stickerFor(mutation: Mutation, date: string, seed: number): Sticker {
  return {
    id: crypto.randomUUID(),
    kind: "daily",
    title: pick(["今日有点响", "轻微变形中", "答案已发芽", "暂时很像自己"], seed),
    subtitle: mutation.label,
    date,
    tone: pick(["coral", "blue", "yellow", "green"] as const, seed, 2),
  };
}

export function createDailyResult(options: {
  avatar: Avatar;
  question: DailyQuestion;
  answer: string;
  date: string;
}): { avatar: Avatar; entry: DailyEntry } {
  const traitDelta = deriveDelta(options.answer, options.question);
  const mutation = chooseMutation(options.avatar, options.answer, options.date);
  const traits = { ...options.avatar.traits };
  for (const [key, value] of Object.entries(traitDelta) as Array<[TraitKey, number]>) {
    traits[key] = clampTrait(traits[key] + value);
  }
  const baseAvatar = { ...options.avatar, traits };
  const avatar = applyMutation(baseAvatar, mutation);
  const response = responseFor(avatar, mutation, options.answer);
  const sticker = stickerFor(mutation, options.date, hashString(response));
  return {
    avatar,
    entry: {
      id: crypto.randomUUID(),
      date: options.date,
      questionId: options.question.id,
      question: options.question.prompt,
      answer: options.answer.trim(),
      response,
      traitDelta,
      mutation,
      sticker,
    },
  };
}

export function createPublicSnapshot(avatar: Avatar, sticker: Sticker | null): PublicAvatarSnapshot {
  return {
    avatarId: avatar.id,
    name: avatar.name,
    traits: {
      energy: avatar.traits.energy,
      softness: avatar.traits.softness,
      oddness: avatar.traits.oddness,
    },
    parts: avatar.parts,
    mutationCount: avatar.mutationCount,
    publicLine: avatar.traits.oddness > 58 ? "正在认真地长歪。" : "今天也在缓慢成为自己。",
    sticker,
  };
}

export function createShare(avatar: Avatar, sticker: Sticker | null, now = new Date()): ShareRecord {
  return {
    id: crypto.randomUUID().replaceAll("-", "").slice(0, 22),
    createdAt: now.toISOString(),
    snapshot: createPublicSnapshot(avatar, sticker),
  };
}

export function createGuestInteraction(options: {
  share: ShareRecord;
  visitorId: string;
  action: GuestAction;
  now?: Date;
}): GuestInteraction {
  const now = options.now ?? new Date();
  const seed = hashString(`${options.share.id}:${options.visitorId}:${options.action}`);
  const actionCopy: Record<GuestAction, string[]> = {
    poke: ["它晃了两下，决定把这当作问候。", "它假装没注意，然后偷偷靠近了一点。"],
    feed: ["它收下奇怪食物，并郑重藏进不存在的口袋。", "它吃了一口，眼神变得很有意见。"],
    label: ["标签贴歪了，但它坚持这样更准确。", "它读完标签，宣布今天暂时接受这个身份。"],
  };
  const labels: Record<GuestAction, string> = {
    poke: "被轻轻戳过",
    feed: "收到神秘投喂",
    label: "获得临时定义",
  };
  return {
    shareId: options.share.id,
    visitorId: options.visitorId,
    action: options.action,
    response: pick(actionCopy[options.action], seed),
    sticker: {
      id: crypto.randomUUID(),
      kind: "relationship",
      title: "关系发生了一下",
      subtitle: labels[options.action],
      date: localDate(now),
      tone: pick(["coral", "blue", "yellow"] as const, seed),
    },
    createdAt: now.toISOString(),
  };
}
