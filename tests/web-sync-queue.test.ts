import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { MemoDetail, MemoEditSession } from "@edgeever/shared";
import type { MemoUpdateSyncPayload } from "../apps/web/src/lib/local-db";

const { localDb } = await import("../apps/web/src/lib/local-db");
const { getMemoCreateQueueId, getMemoUpdateQueueId, isLocalOnlyMemoId, isMemoUpdateAlreadyApplied, queueMemoCreate, queueMemoUpdate, saveLocalMemoChanges, syncQueuedChanges } = await import("../apps/web/src/lib/sync-queue");
const originalFetch = globalThis.fetch;

const payload = (title: string, revision = 0): MemoUpdateSyncPayload => ({
  memoId: "memo_sync_test",
  expectedRevision: revision,
  expectedContentHash: `hash-${revision}`,
  editSessionId: "original-session",
  title,
  contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: title }] }] },
  tags: [],
});

const memo = (title: string, revision = 1): MemoDetail => ({
  id: "memo_sync_test",
  notebookId: "nb_inbox",
  title,
  excerpt: title,
  tags: [],
  isPinned: false,
  isArchived: false,
  isDeleted: false,
  revision,
  createdAt: "2026-07-15T00:00:00.000Z",
  updatedAt: "2026-07-15T00:00:01.000Z",
  deletedAt: null,
  contentJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: title }] }] },
  contentMarkdown: title,
  contentText: title,
  contentHash: `hash-${revision}`,
  sourceMemoIds: [],
  mergeSourceCount: 0,
  mergedIntoMemoId: null,
});

const session = (revision = 0): MemoEditSession => ({
  id: `edit-${revision}`,
  memoId: "memo_sync_test",
  baseRevision: revision,
  baseContentHash: `hash-${revision}`,
  expiresAt: "2026-08-15T00:00:00.000Z",
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(async () => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { onLine: true },
  });
  await localDb.transaction("rw", localDb.drafts, localDb.syncQueue, localDb.localMemos, async () => {
    await localDb.drafts.clear();
    await localDb.syncQueue.clear();
    await localDb.localMemos.clear();
  });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("web sync queue concurrency", () => {
  test("recognizes a legacy queued snapshot that is already fully stored on the server", async () => {
    await queueMemoUpdate(payload("already saved"));
    const queued = await localDb.syncQueue.get(getMemoUpdateQueueId("memo_sync_test"));

    expect(queued).toBeDefined();
    expect(isMemoUpdateAlreadyApplied(memo("already saved"), queued!)).toBe(true);
    expect(isMemoUpdateAlreadyApplied(memo("different remote text"), queued!)).toBe(false);
  });

  test("coalesces simultaneous sync runs so one queued save is sent only once", async () => {
    await queueMemoUpdate(payload("latest text"));
    let requestCount = 0;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestCount += 1;
      const url = String(input);
      if (url.endsWith("/edit-sessions")) {
        return jsonResponse({ editSession: session() });
      }
      return jsonResponse({ memo: memo("latest text") });
    }) as typeof fetch;

    const [first, second] = await Promise.all([syncQueuedChanges(), syncQueuedChanges()]);

    expect(requestCount).toBe(2);
    expect(first).toEqual({ attempted: 1, synced: 1, failed: 0, conflicted: 0 });
    expect(second).toEqual(first);
    expect(await localDb.syncQueue.count()).toBe(0);
  });

  test("does not delete a newer draft queued while an older request is in flight", async () => {
    await queueMemoUpdate(payload("older text"));
    let releaseUpdate!: () => void;
    let updateStarted!: () => void;
    const updateStartedPromise = new Promise<void>((resolve) => {
      updateStarted = resolve;
    });
    const releaseUpdatePromise = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/edit-sessions")) {
        return jsonResponse({ editSession: session() });
      }
      updateStarted();
      await releaseUpdatePromise;
      return jsonResponse({ memo: memo("older text") });
    }) as typeof fetch;

    const runningSync = syncQueuedChanges();
    await updateStartedPromise;
    await queueMemoUpdate(payload("newer text"));
    releaseUpdate();
    const result = await runningSync;

    const queued = await localDb.syncQueue.get(getMemoUpdateQueueId("memo_sync_test"));
    expect(result).toEqual({ attempted: 1, synced: 0, failed: 0, conflicted: 0 });
    expect(queued?.status).toBe("pending");
    expect(queued?.payload.title).toBe("newer text");
  });

  test("keeps a genuine server revision mismatch as a conflict", async () => {
    await queueMemoUpdate(payload("offline edit"));
    globalThis.fetch = (async () => jsonResponse({ editSession: session(1) })) as typeof fetch;

    const result = await syncQueuedChanges();
    const queued = await localDb.syncQueue.get(getMemoUpdateQueueId("memo_sync_test"));

    expect(result).toEqual({ attempted: 1, synced: 0, failed: 0, conflicted: 1 });
    expect(queued?.status).toBe("conflict");
    expect(queued?.payload.title).toBe("offline edit");
  });
});

describe("local-only memo edits", () => {
  test("coalesces offline edits into the queued create payload", async () => {
    const localId = "local-test-memo";
    const createdAt = "2026-07-15T00:00:00.000Z";

    await localDb.localMemos.add({
      id: localId,
      notebookId: "nb_inbox",
      title: "Original",
      contentMarkdown: "Original body",
      tags: ["a"],
      status: "pending",
      errorMessage: null,
      createdAt,
      updatedAt: createdAt,
    });

    await queueMemoCreate({
      localMemoId: localId,
      notebookId: "nb_inbox",
      title: "Original",
      contentMarkdown: "Original body",
      tags: ["a"],
      createdAt,
      updatedAt: createdAt,
    });

    await saveLocalMemoChanges(localId, {
      title: "Updated title",
      contentMarkdown: "Updated body",
      tags: ["a", "b"],
      updatedAt: "2026-07-15T01:00:00.000Z",
    });

    const localMemo = await localDb.localMemos.get(localId);
    const queued = await localDb.syncQueue.get(getMemoCreateQueueId(localId));

    expect(localMemo?.title).toBe("Updated title");
    expect(localMemo?.contentMarkdown).toBe("Updated body");
    expect(localMemo?.tags).toEqual(["a", "b"]);
    expect(localMemo?.updatedAt).toBe("2026-07-15T01:00:00.000Z");

    expect(queued).toBeDefined();
    expect(queued?.kind).toBe("memo.create");
    const createPayload = queued?.payload as import("../apps/web/src/lib/local-db").MemoCreateSyncPayload;
    expect(createPayload.title).toBe("Updated title");
    expect(createPayload.contentMarkdown).toBe("Updated body");
    expect(createPayload.tags).toEqual(["a", "b"]);
    expect(createPayload.updatedAt).toBe("2026-07-15T01:00:00.000Z");
    expect(createPayload.createdAt).toBe(createdAt);
  });

  test("updates notebook for a local-only memo", async () => {
    const localId = "local-notebook-move";
    const createdAt = "2026-07-15T00:00:00.000Z";

    await localDb.localMemos.add({
      id: localId,
      notebookId: "nb_inbox",
      title: "Move me",
      contentMarkdown: "Body",
      tags: [],
      status: "pending",
      errorMessage: null,
      createdAt,
      updatedAt: createdAt,
    });

    await queueMemoCreate({
      localMemoId: localId,
      notebookId: "nb_inbox",
      title: "Move me",
      contentMarkdown: "Body",
      tags: [],
      createdAt,
      updatedAt: createdAt,
    });

    await saveLocalMemoChanges(localId, { notebookId: "nb_archive", updatedAt: "2026-07-15T02:00:00.000Z" });

    const localMemo = await localDb.localMemos.get(localId);
    const queued = await localDb.syncQueue.get(getMemoCreateQueueId(localId));
    const createPayload = queued?.payload as import("../apps/web/src/lib/local-db").MemoCreateSyncPayload;

    expect(localMemo?.notebookId).toBe("nb_archive");
    expect(createPayload.notebookId).toBe("nb_archive");
  });

  test("throws when local memo is missing", async () => {
    await expect(
      saveLocalMemoChanges("local-missing", { title: "X", contentMarkdown: "Y", tags: [] })
    ).rejects.toThrow("Local memo local-missing not found");
  });

  test("throws when create queue item is missing", async () => {
    const localId = "local-no-queue";
    await localDb.localMemos.add({
      id: localId,
      notebookId: "nb_inbox",
      title: "No queue",
      contentMarkdown: "Body",
      tags: [],
      status: "pending",
      errorMessage: null,
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
    });

    await expect(
      saveLocalMemoChanges(localId, { title: "X", contentMarkdown: "Y", tags: [] })
    ).rejects.toThrow("Create sync queue item for local memo local-no-queue not found");
  });

  test("identifies local-only memo ids", () => {
    expect(isLocalOnlyMemoId("local-abc")).toBe(true);
    expect(isLocalOnlyMemoId("memo_123")).toBe(false);
  });
});
