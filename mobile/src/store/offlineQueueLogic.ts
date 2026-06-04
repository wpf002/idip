// Pure offline-queue logic (no native deps) — unit tested in isolation.
export interface QueueItem {
  id: string;
  barcode_data: string;
  document_input_type?: string;
  scan_method?: string;
  client_timestamp: string; // ISO8601
}

/** Flush order: ascending by client_timestamp (chronological). */
export function sortByClientTimestamp(items: QueueItem[]): QueueItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.client_timestamp).getTime() - new Date(b.client_timestamp).getTime(),
  );
}

/** Last-write-wins de-duplication by id (keep the latest client_timestamp). */
export function dedupeLastWriteWins(items: QueueItem[]): QueueItem[] {
  const byId = new Map<string, QueueItem>();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (
      !existing ||
      new Date(item.client_timestamp).getTime() >
        new Date(existing.client_timestamp).getTime()
    ) {
      byId.set(item.id, item);
    }
  }
  return sortByClientTimestamp([...byId.values()]);
}

/** Auto-sync fires when online with a non-empty queue. */
export function shouldSync(isOnline: boolean, pendingCount: number): boolean {
  return isOnline && pendingCount > 0;
}

/** The backend accepts at most 500 records per /v1/sync call. */
export const MAX_SYNC_BATCH = 500;

export function chunkForSync(items: QueueItem[]): QueueItem[][] {
  const ordered = sortByClientTimestamp(items);
  const chunks: QueueItem[][] = [];
  for (let i = 0; i < ordered.length; i += MAX_SYNC_BATCH) {
    chunks.push(ordered.slice(i, i + MAX_SYNC_BATCH));
  }
  return chunks;
}
