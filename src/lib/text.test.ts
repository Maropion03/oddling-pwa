import { describe, expect, it } from "vitest";
import { compactDate, plainText } from "@/lib/text";

describe("display text", () => {
  it("removes punctuation from system copy", () => {
    expect(plainText("它晃了两下，决定把这当作问候。"))
      .toBe("它晃了两下决定把这当作问候");
  });

  it("uses a compact date without separators", () => {
    expect(compactDate("2026-07-11")).toBe("20260711");
  });
});
