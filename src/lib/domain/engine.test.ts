import { describe, expect, it } from "vitest";
import { DAILY_QUESTIONS } from "./questions";
import {
  applyMutation,
  createDailyResult,
  createGuestInteraction,
  createPublicSnapshot,
  createShare,
  generateAvatar,
  selectDailyQuestion,
} from "./engine";

const onboarding = {
  choices: [
    { questionId: "shelter", optionId: "puddle" },
    { questionId: "signal", optionId: "reply" },
    { questionId: "gift", optionId: "seed" },
  ],
  freeText: "我会把今天折成一只纸船",
};

describe("Oddling domain engine", () => {
  it("ships exactly 72 curated questions across six equal categories", () => {
    expect(DAILY_QUESTIONS).toHaveLength(72);
    const counts = Object.groupBy(DAILY_QUESTIONS, (question) => question.category);
    expect(Object.values(counts).map((items) => items?.length)).toEqual([12, 12, 12, 12, 12, 12]);
  });

  it("creates a stable avatar whose initial traits stay between 25 and 75", () => {
    const first = generateAvatar(onboarding, new Date("2026-07-10T08:00:00Z"));
    const second = generateAvatar(onboarding, new Date("2026-07-10T08:00:00Z"));
    expect(first.seed).toBe(second.seed);
    expect(first.parts).toEqual(second.parts);
    expect(Object.values(first.traits).every((value) => value >= 25 && value <= 75)).toBe(true);
  });

  it("avoids questions seen in the last 30 days and avoids a third same category", () => {
    const history = DAILY_QUESTIONS.slice(0, 30).map((question, index) => ({
      date: `2026-06-${String(index + 1).padStart(2, "0")}`,
      questionId: question.id,
    }));
    history.splice(-2, 2,
      { date: "2026-07-08", questionId: "social-01" },
      { date: "2026-07-09", questionId: "social-02" },
    );
    const selected = selectDailyQuestion({ avatarSeed: "abc", date: "2026-07-10", history });
    expect(history.map((item) => item.questionId)).not.toContain(selected.id);
    expect(selected.category).not.toBe("social");
  });

  it("creates one bounded two-axis delta and one permanent mutation", () => {
    const avatar = generateAvatar(onboarding);
    const question = DAILY_QUESTIONS[0];
    const result = createDailyResult({ avatar, question, answer: "先听一会儿，再决定", date: "2026-07-10" });
    expect(Object.keys(result.entry.traitDelta)).toHaveLength(2);
    expect(Object.values(result.entry.traitDelta).every((value) => Math.abs(value ?? 0) <= 5)).toBe(true);
    expect(result.avatar.mutationCount).toBe(1);
    expect(result.entry.sticker.kind).toBe("daily");
  });

  it("keeps at most two texture slots", () => {
    const avatar = generateAvatar(onboarding);
    const once = applyMutation(avatar, {
      id: "m1", date: "2026-07-10", slot: "texture", token: "stars", label: "星", previousToken: null,
    });
    const twice = applyMutation(once, {
      id: "m2", date: "2026-07-11", slot: "texture", token: "patch", label: "补丁", previousToken: null,
    });
    expect(twice.parts.textures).toHaveLength(2);
    expect(twice.parts.textures).toEqual(["stars", "patch"]);
  });

  it("public snapshots omit private answers and internal order/social traits", () => {
    const avatar = generateAvatar(onboarding);
    const snapshot = createPublicSnapshot(avatar, null);
    expect(snapshot).not.toHaveProperty("answer");
    expect(snapshot.traits).not.toHaveProperty("order");
    expect(snapshot.traits).not.toHaveProperty("social");
  });

  it("returns the same guest response for the same visitor and action", () => {
    const avatar = generateAvatar(onboarding);
    const share = createShare(avatar, null, new Date("2026-07-10T08:00:00Z"));
    const first = createGuestInteraction({ share, visitorId: "visitor", action: "poke" });
    const second = createGuestInteraction({ share, visitorId: "visitor", action: "poke" });
    expect(first.response).toBe(second.response);
    expect(first.sticker.subtitle).toBe(second.sticker.subtitle);
  });
});
