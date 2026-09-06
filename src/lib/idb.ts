import { del, get, set } from 'idb-keyval'

/** All IndexedDB access lives here: the query-cache persister storage and the outbox. */

export const idbStorage = {
  getItem: async (key: string): Promise<string | null> => (await get<string>(key)) ?? null,
  setItem: (key: string, value: string): Promise<void> => set(key, value),
  removeItem: (key: string): Promise<void> => del(key),
}

const OUTBOX_KEY = 'outbox'

/** The queue is one value — trivially FIFO, and Blobs survive the structured clone. */
export function loadOutbox<T>(): Promise<T | undefined> {
  return get<T>(OUTBOX_KEY)
}

export function saveOutbox<T>(queue: T): Promise<void> {
  return set(OUTBOX_KEY, queue)
}
