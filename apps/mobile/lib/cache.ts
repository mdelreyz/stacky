import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "protocols_cache:";
const QUEUE_KEY = "protocols_write_queue";

// ── Read-through cache ──────────────────────────────────────────────

interface CachedEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Wrap an async API call with read-through caching.
 *
 * - Online: fetches fresh data, writes it to cache, returns it.
 * - Offline / error: returns cached data if available and within maxAge.
 * - No cache and offline: throws the original error.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  maxAgeMs: number = 30 * 60 * 1000, // 30 minutes default
): Promise<T> {
  try {
    const data = await fetcher();
    // Write to cache in background — don't block the return
    void writeCache(key, data);
    return data;
  } catch (error) {
    // Fetch failed — try cache
    const entry = await readCache<T>(key);
    if (entry && Date.now() - entry.timestamp < maxAgeMs) {
      return entry.data;
    }
    throw error;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CachedEntry<T> = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Cache write failure is non-fatal
  }
}

async function readCache<T>(key: string): Promise<CachedEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as CachedEntry<T>;
  } catch {
    return null;
  }
}

/**
 * Check if cached data exists and return it (even if stale).
 * Used for showing stale data immediately while refreshing in background.
 */
export async function getCachedValue<T>(key: string): Promise<T | null> {
  const entry = await readCache<T>(key);
  return entry?.data ?? null;
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // Non-fatal
  }
}

/**
 * Clear all cached data (e.g., on logout).
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // Non-fatal
  }
}

// ── Write queue (offline adherence, etc.) ───────────────────────────

export interface QueuedWrite {
  id: string;
  path: string;
  method: string;
  body?: string;
  createdAt: number;
}

/**
 * Enqueue a write operation to be retried when back online.
 */
export async function enqueueWrite(write: Omit<QueuedWrite, "id" | "createdAt">): Promise<void> {
  const queue = await getWriteQueue();
  queue.push({
    ...write,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Get all pending writes.
 */
export async function getWriteQueue(): Promise<QueuedWrite[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedWrite[];
  } catch {
    return [];
  }
}

/**
 * Remove a write from the queue after successful replay.
 */
export async function dequeueWrite(id: string): Promise<void> {
  const queue = await getWriteQueue();
  const filtered = queue.filter((w) => w.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

/**
 * Clear the entire write queue.
 */
export async function clearWriteQueue(): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
}
