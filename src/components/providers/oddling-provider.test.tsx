import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const signInAnonymously = vi.fn();
const client = { auth: { getUser, signInAnonymously } };

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => client,
}));

import { ensureCloudUser } from "./oddling-provider";

describe("ensureCloudUser", () => {
  beforeEach(() => {
    getUser.mockReset();
    signInAnonymously.mockReset();
  });

  it("creates an anonymous session when Supabase reports a missing session", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("Auth session missing!") });
    signInAnonymously.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    await expect(ensureCloudUser()).resolves.toBe(client);
    expect(signInAnonymously).toHaveBeenCalledOnce();
  });

  it("reuses an existing session without creating another anonymous user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    await expect(ensureCloudUser()).resolves.toBe(client);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });
});
