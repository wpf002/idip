import {
  sortByClientTimestamp,
  dedupeLastWriteWins,
  shouldSync,
  chunkForSync,
  MAX_SYNC_BATCH,
  QueueItem,
} from '../src/store/offlineQueueLogic';

const item = (id: string, ts: string): QueueItem => ({
  id,
  barcode_data: `data-${id}`,
  client_timestamp: ts,
});

describe('offline queue logic', () => {
  test('sorts by client_timestamp ascending', () => {
    const items = [
      item('a', '2026-01-01T22:10:00Z'),
      item('b', '2026-01-01T22:00:00Z'),
      item('c', '2026-01-01T22:05:00Z'),
    ];
    expect(sortByClientTimestamp(items).map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  test('dedupe keeps the latest write per id', () => {
    const items = [
      item('x', '2026-01-01T22:00:00Z'),
      item('x', '2026-01-01T22:30:00Z'),
      item('y', '2026-01-01T22:05:00Z'),
    ];
    const deduped = dedupeLastWriteWins(items);
    expect(deduped).toHaveLength(2);
    const x = deduped.find((i) => i.id === 'x')!;
    expect(x.client_timestamp).toBe('2026-01-01T22:30:00Z');
  });

  test('shouldSync only when online with pending items', () => {
    expect(shouldSync(true, 3)).toBe(true);
    expect(shouldSync(false, 3)).toBe(false);
    expect(shouldSync(true, 0)).toBe(false);
  });

  test('chunkForSync respects the 500-record cap', () => {
    const many = Array.from({ length: 1200 }, (_, i) =>
      item(String(i), `2026-01-01T00:00:${String(i % 60).padStart(2, '0')}Z`),
    );
    const chunks = chunkForSync(many);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(MAX_SYNC_BATCH);
    expect(chunks[2]).toHaveLength(200);
  });
});
