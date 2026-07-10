import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

describe("API route guards", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  });

  it("rejects cross-origin mutations before touching authentication", async () => {
    const { POST } = await import("./avatar/create/route");
    const request = new NextRequest("http://localhost:3000/api/avatar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://attacker.example" },
      body: JSON.stringify({}),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("returns validation errors before cloud configuration errors", async () => {
    const { POST } = await import("./daily/respond/route");
    const request = new NextRequest("http://localhost:3000/api/daily/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ date: "bad", answer: "" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("labels valid private requests as unavailable when Supabase is absent", async () => {
    const { POST } = await import("./avatar/create/route");
    const request = new NextRequest("http://localhost:3000/api/avatar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({
        choices: [
          { questionId: "shelter", optionId: "blanket" },
          { questionId: "signal", optionId: "reply" },
          { questionId: "gift", optionId: "seed" },
        ],
        freeText: "留下一点勇气",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(503);
  });

  it("rejects malformed public share tokens", async () => {
    const { GET } = await import("./public/shares/[token]/route");
    const response = await GET(new Request("http://localhost:3000"), { params: Promise.resolve({ token: "../secret" }) });
    expect(response.status).toBe(400);
  });
});
