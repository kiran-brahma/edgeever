import { describe, expect, test } from "bun:test";
import { isMemoEditBindingValid, isSuspiciousMemoOverwrite } from "./memo-safety.ts";

describe("isSuspiciousMemoOverwrite", () => {
  test("blocks the production incident shape", () => {
    expect(
      isSuspiciousMemoOverwrite(
        "UK giffgaff SIM activation",
        "original".repeat(550),
        "Seller SongSong GPT Philippines region",
        "wrong".repeat(70)
      )
    ).toBe(true);
  });

  test("allows image-width-only saves", () => {
    expect(
      isSuspiciousMemoOverwrite("Same title", "Body text".repeat(300), "Same title", "Body text".repeat(300))
    ).toBe(false);
  });

  test("allows a title rename when content remains intact", () => {
    expect(
      isSuspiciousMemoOverwrite("Old title", "Body text".repeat(300), "New title", "Body text".repeat(290))
    ).toBe(false);
  });

  test("does not interfere with short notes", () => {
    expect(isSuspiciousMemoOverwrite("Old title", "Short content", "New title", "")).toBe(false);
  });
});

describe("isMemoEditBindingValid", () => {
  const current = { memoId: "memo_a", revision: 7, contentHash: "a".repeat(64) };
  const session = {
    id: "edit_1",
    memoId: "memo_a",
    baseRevision: 7,
    baseContentHash: "a".repeat(64),
  };
  const request = {
    editSessionId: "edit_1",
    memoId: "memo_a",
    expectedRevision: 7,
    expectedContentHash: "a".repeat(64),
  };

  test("accepts a fully bound save", () => {
    expect(isMemoEditBindingValid(current, session, request)).toBe(true);
  });

  test("rejects a session from another memo", () => {
    expect(isMemoEditBindingValid(current, { ...session, memoId: "memo_b" }, request)).toBe(false);
  });

  test("rejects a stale revision", () => {
    expect(isMemoEditBindingValid(current, session, { ...request, expectedRevision: 6 })).toBe(false);
  });

  test("rejects a stale content hash", () => {
    expect(isMemoEditBindingValid(current, session, { ...request, expectedContentHash: "b".repeat(64) })).toBe(false);
  });

  test("rejects a different edit-session id", () => {
    expect(isMemoEditBindingValid(current, session, { ...request, editSessionId: "edit_2" })).toBe(false);
  });
});
