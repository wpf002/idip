// Offline queue: persists scans to SQLite, auto-syncs on reconnect.
import { create } from 'zustand';
import { open } from '@op-engineering/op-sqlite';
import {
  QueueItem,
  dedupeLastWriteWins,
  shouldSync,
  chunkForSync,
} from './offlineQueueLogic';
import { IDIPClient } from '../api/client';

const db = open({ name: 'idip.sqlite' });

db.execute(
  `CREATE TABLE IF NOT EXISTS scan_queue (
     id TEXT PRIMARY KEY,
     barcode_data TEXT,
     document_input_type TEXT,
     scan_method TEXT,
     client_timestamp TEXT
   )`,
);

interface OfflineQueueState {
  pending: QueueItem[];
  enqueue: (item: QueueItem) => void;
  flush: (client: IDIPClient, isOnline: boolean) => Promise<number>;
  pendingCount: () => number;
}

export const useOfflineQueue = create<OfflineQueueState>((set, get) => ({
  pending: [],

  enqueue(item) {
    db.execute(
      `INSERT OR REPLACE INTO scan_queue
       (id, barcode_data, document_input_type, scan_method, client_timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [
        item.id,
        item.barcode_data,
        item.document_input_type ?? 'AUTO',
        item.scan_method ?? 'camera',
        item.client_timestamp,
      ],
    );
    set((s) => ({ pending: dedupeLastWriteWins([...s.pending, item]) }));
  },

  async flush(client, isOnline) {
    const pending = get().pending;
    if (!shouldSync(isOnline, pending.length)) return 0;
    let synced = 0;
    for (const batch of chunkForSync(pending)) {
      await client.sync(
        batch.map((b) => ({
          barcode_data: b.barcode_data,
          document_input_type: (b.document_input_type as 'AUTO') ?? 'AUTO',
          scan_method: (b.scan_method as 'camera') ?? 'camera',
          client_timestamp: b.client_timestamp,
        })),
      );
      synced += batch.length;
    }
    db.execute('DELETE FROM scan_queue');
    set({ pending: [] });
    return synced;
  },

  pendingCount() {
    return get().pending.length;
  },
}));
