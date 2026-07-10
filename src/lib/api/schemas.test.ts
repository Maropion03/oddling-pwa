import { describe, expect, it } from "vitest";
import { createAvatarSchema, dailyResponseSchema, guestInteractionSchema } from "./schemas";

describe("API schemas", () => {
  it("accepts exactly three onboarding choices and a short answer", () => {
    const parsed = createAvatarSchema.parse({
      choices: [
        { questionId: "shelter", optionId: "blanket" },
        { questionId: "signal", optionId: "reply" },
        { questionId: "gift", optionId: "seed" },
      ],
      freeText: "留下一点勇气",
    });
    expect(parsed.rebuild).toBe(false);
  });

  it("rejects answers above 60 characters and invalid calendar dates", () => {
    expect(() => dailyResponseSchema.parse({
      date: "2026-02-30",
      timezone: "Asia/Shanghai",
      questionId: "absurd-01",
      answer: "长".repeat(61),
    })).toThrow();
  });

  it("requires UUID visitors and a whitelisted guest action", () => {
    expect(() => guestInteractionSchema.parse({ visitorId: "visitor", action: "delete" })).toThrow();
    expect(guestInteractionSchema.parse({
      visitorId: "6dc8c9d7-3f47-42d2-a2aa-11d0cfaa1c2d",
      action: "feed",
    }).action).toBe("feed");
  });
});
