import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateAvatar } from "@/lib/domain/engine";
import { DAILY_QUESTIONS } from "@/lib/domain/questions";
import { generateAiFlavor } from "./llm";

vi.mock("server-only", () => ({}));

describe("LLM deterministic fallback", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("LLM_API_KEY", "");
    vi.stubEnv("LLM_BASE_URL", "");
    vi.stubEnv("LLM_MODEL", "");
  });

  it("returns null immediately when no provider is configured", async () => {
    const avatar = generateAvatar({
      choices: [
        { questionId: "shelter", optionId: "blanket" },
        { questionId: "signal", optionId: "reply" },
        { questionId: "gift", optionId: "seed" },
      ],
      freeText: "留下一点勇气",
    });
    const flavor = await generateAiFlavor({ avatar, question: DAILY_QUESTIONS[0], answer: "先听一会" });
    expect(flavor).toBeNull();
  });
});
