import type { MemoDetail, TiptapDoc } from "@edgeever/shared";
import { liveQuery } from "dexie";
import { ApiRequestError, api } from "@/lib/api";
import { localDb, type MemoCreateSyncPayload, type MemoUpdateSyncPayload, type SyncQueueItem } from "@/lib/local-db";

export type SyncQueueSummary = {
  total: number;
  pending: number;
  syncing: number;
  conflict: number;
  error: number;
};

export type SyncRunResult = {
  attempted: number;
  synced: number;
  failed: number;
  conflicted: number;
};

export const emptySyncQueueSummary = (): SyncQueueSummary => ({
  total: 0,
  pending: 0,
  syncing: 0,
  conflict: 0,
  error: 0,
});

export const getMemoUpdateQueueId = (memoId: string) => `memo.update:${memoId}`;
export const getMemoCreateQueueId = (localMemoId: string) => `memo.create:${localMemoId}`;

export const isLocalOnlyMemoId = (memoId: string) => memoId.startsWith("local-");

export const isLocalOnlyMemo = (
  memo: { id: string; isLocalOnly?: boolean } | null | undefined
): memo is { id: string; isLocalOnly: true } =>
  Boolean(memo && (memo.isLocalOnly || isLocalOnlyMemoId(memo.id)));

export type LocalMemoEditPayload = {
  title?: string;
  contentMarkdown?: string;
  tags?: string[];
  notebookId?: string;
  updatedAt?: string;
};

/**
 * Persist edits to a local-only memo by updating both the local mirror and the
 * queued `memo.create` item. Because the create payload is what the server will
 * eventually receive, coalescing edits into it means the note is created with the
 * latest offline content on reconnect.
 */
export const saveLocalMemoChanges = async (localMemoId: string, payload: LocalMemoEditPayload): Promise<void> => {
  const queueId = getMemoCreateQueueId(localMemoId);
  const now = payload.updatedAt ?? new Date().toISOString();

  await localDb.transaction("rw", localDb.localMemos, localDb.syncQueue, async () => {
    const localMemo = await localDb.localMemos.get(localMemoId);
    if (!localMemo) {
      throw new Error(`Local memo ${localMemoId} not found`);
    }

    const queuedCreate = await localDb.syncQueue.get(queueId);
    if (!queuedCreate || queuedCreate.kind !== "memo.create") {
      throw new Error(`Create sync queue item for local memo ${localMemoId} not found`);
    }

    const createPayload = queuedCreate.payload as MemoCreateSyncPayload;

    const nextPayload: MemoCreateSyncPayload = {
      ...createPayload,
      title: payload.title ?? createPayload.title,
      contentMarkdown: payload.contentMarkdown ?? createPayload.contentMarkdown,
      tags: payload.tags ?? createPayload.tags,
      notebookId: payload.notebookId ?? createPayload.notebookId,
      updatedAt: now,
    };

    await localDb.localMemos.update(localMemoId, {
      title: nextPayload.title,
      contentMarkdown: nextPayload.contentMarkdown,
      tags: nextPayload.tags,
      notebookId: nextPayload.notebookId,
      updatedAt: now,
    });

    await localDb.syncQueue.put({
      ...queuedCreate,
      payload: nextPayload,
      updatedAt: now,
    });
  });
};

export const queueMemoUpdate = async (payload: MemoUpdateSyncPayload) => {
  const id = getMemoUpdateQueueId(payload.memoId);
  const now = new Date().toISOString();
  await localDb.transaction("rw", localDb.syncQueue, async () => {
    const existing = await localDb.syncQueue.get(id);

    await localDb.syncQueue.put({
      id,
      kind: "memo.update",
      memoId: payload.memoId,
      status: "pending",
      payload,
      attemptCount: existing?.attemptCount ?? 0,
      lastError: null,
      nextAttemptAt: null,
      claimId: null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  });
};

export const queueMemoCreate = async (payload: MemoCreateSyncPayload) => {
  const id = getMemoCreateQueueId(payload.localMemoId);
  const now = new Date().toISOString();
  await localDb.transaction("rw", localDb.syncQueue, async () => {
    const existing = await localDb.syncQueue.get(id);

    await localDb.syncQueue.put({
      id,
      kind: "memo.create",
      memoId: payload.localMemoId,
      status: "pending",
      payload,
      attemptCount: existing?.attemptCount ?? 0,
      lastError: null,
      nextAttemptAt: null,
      claimId: null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  });
};

export const observeSyncQueue = (onChange: (summary: SyncQueueSummary) => void) => {
  const subscription = liveQuery(async () => summarizeSyncQueue(await localDb.syncQueue.toArray())).subscribe({
    next: onChange,
    error: () => onChange(emptySyncQueueSummary()),
  });

  return () => subscription.unsubscribe();
};

export const isMemoUpdateAlreadyApplied = (memo: MemoDetail, item: SyncQueueItem) => {
  if (item.kind !== "memo.update" || memo.id !== item.memoId || memo.title !== item.payload.title) {
    return false;
  }

  const updatePayload = item.payload as MemoUpdateSyncPayload;
  const remoteTags = [...memo.tags].sort((left, right) => left.localeCompare(right));
  const queuedTags = [...updatePayload.tags].sort((left, right) => left.localeCompare(right));
  return JSON.stringify(remoteTags) === JSON.stringify(queuedTags) &&
    JSON.stringify(memo.contentJson) === JSON.stringify(updatePayload.contentJson);
};

let activeSyncPromise: Promise<SyncRunResult> | null = null;

export const syncQueuedChanges = (options: {
  onSynced?: (memo: MemoDetail) => void | Promise<void>;
} = {}): Promise<SyncRunResult> => {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = runQueuedChanges(options).finally(() => {
    activeSyncPromise = null;
  });

  return activeSyncPromise;
};

const runQueuedChanges = async (options: {
  onSynced?: (memo: MemoDetail) => void | Promise<void>;
}): Promise<SyncRunResult> => {
  const result: SyncRunResult = {
    attempted: 0,
    synced: 0,
    failed: 0,
    conflicted: 0,
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return result;
  }

  const now = new Date();
  const items = (await localDb.syncQueue.where("status").anyOf("pending", "error").toArray())
    .filter((item) => !item.nextAttemptAt || new Date(item.nextAttemptAt) <= now)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  for (const candidate of items) {
    const item = await claimQueueItem(candidate.id);
    if (!item) {
      continue;
    }

    result.attempted += 1;

    try {
      const memo = await syncQueueItem(item);
      const removed = await removeClaimedQueueItem(item);
      if (removed) {
        await localDb.drafts.delete(item.memoId);
        await options.onSynced?.(memo);
        result.synced += 1;
      }
    } catch (error) {
      const status = isRevisionConflict(error) ? "conflict" : "error";
      const attemptCount = item.attemptCount + 1;

      const updated = await updateClaimedQueueItem(item, {
        status,
        attemptCount,
        lastError: getErrorMessage(error),
        nextAttemptAt: status === "error" ? nextRetryAt(attemptCount) : null,
        claimId: null,
        updatedAt: new Date().toISOString(),
      });

      if (!updated) {
        continue;
      } else if (status === "conflict") {
        result.conflicted += 1;
      } else {
        result.failed += 1;
      }
    }
  }

  return result;
};

const claimQueueItem = (id: string) =>
  localDb.transaction("rw", localDb.syncQueue, async () => {
    const item = await localDb.syncQueue.get(id);
    if (!item || (item.status !== "pending" && item.status !== "error")) {
      return null;
    }

    const claimId = crypto.randomUUID();
    const claimedItem: SyncQueueItem = {
      ...item,
      status: "syncing",
      claimId,
      updatedAt: new Date().toISOString(),
    };
    await localDb.syncQueue.put(claimedItem);
    return claimedItem;
  });

const removeClaimedQueueItem = (item: SyncQueueItem) =>
  localDb.transaction("rw", localDb.syncQueue, async () => {
    const current = await localDb.syncQueue.get(item.id);
    if (!current || current.claimId !== item.claimId || current.status !== "syncing") {
      return false;
    }

    await localDb.syncQueue.delete(item.id);
    return true;
  });

const updateClaimedQueueItem = (item: SyncQueueItem, patch: Partial<SyncQueueItem>) =>
  localDb.transaction("rw", localDb.syncQueue, async () => {
    const current = await localDb.syncQueue.get(item.id);
    if (!current || current.claimId !== item.claimId || current.status !== "syncing") {
      return false;
    }

    await localDb.syncQueue.update(item.id, patch);
    return true;
  });

export const shouldQueueMemoSaveError = (error: unknown) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (error instanceof ApiRequestError) {
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }

  return error instanceof TypeError;
};

const syncQueueItem = async (item: SyncQueueItem): Promise<MemoDetail> => {
  if (item.kind === "memo.create") {
    const payload = item.payload as MemoCreateSyncPayload;
    const data = await api.createMemo({
      notebookId: payload.notebookId,
      title: payload.title,
      contentMarkdown: payload.contentMarkdown,
      tags: payload.tags,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    });
    // Replace the local placeholder with the server memo once synced.
    await localDb.localMemos.delete(payload.localMemoId);
    return data.memo;
  }

  if (item.kind !== "memo.update") {
    throw new Error(`Unsupported sync item kind: ${item.kind}`);
  }

  const updatePayload = item.payload as MemoUpdateSyncPayload;
  const { editSession } = await api.createMemoEditSession(item.memoId);
  if (
    editSession.baseRevision !== updatePayload.expectedRevision ||
    editSession.baseContentHash !== updatePayload.expectedContentHash
  ) {
    throw new ApiRequestError("Note changed before the offline draft could sync.", 409, "revision_conflict");
  }

  const data = await api.updateMemo(item.memoId, {
    expectedRevision: updatePayload.expectedRevision,
    expectedContentHash: updatePayload.expectedContentHash,
    editSessionId: editSession.id,
    title: updatePayload.title,
    contentJson: updatePayload.contentJson as TiptapDoc,
    contentMarkdown: updatePayload.contentMarkdown,
    tags: updatePayload.tags,
  });

  return data.memo;
};

const summarizeSyncQueue = (items: SyncQueueItem[]): SyncQueueSummary =>
  items.reduce(
    (summary, item) => {
      summary.total += 1;
      summary[item.status] += 1;
      return summary;
    },
    emptySyncQueueSummary()
  );

const isRevisionConflict = (error: unknown) =>
  error instanceof ApiRequestError && error.code === "revision_conflict";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Sync failed";
};

const nextRetryAt = (attemptCount: number) => {
  const delayMs = Math.min(5 * 60_000, 2 ** Math.min(attemptCount, 6) * 1000);
  return new Date(Date.now() + delayMs).toISOString();
};
