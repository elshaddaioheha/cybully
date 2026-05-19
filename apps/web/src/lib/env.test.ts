import { describe, expect, it, vi } from "vitest";

describe("moderator email parsing", () => {
  it("matches configured moderator addresses case-insensitively", async () => {
    vi.stubEnv("MODERATOR_EMAILS", "MODERATOR@example.com,ops@example.com");
    const { isModeratorEmail } = await import("./env");

    expect(isModeratorEmail("moderator@example.com")).toBe(true);
    expect(isModeratorEmail("user@example.com")).toBe(false);
  });
});

