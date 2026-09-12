import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const globalForCache = globalThis as unknown as { signalDeskDb?: DatabaseSync };

function dbPath() {
  return process.env.MARKET_DATA_CACHE_PATH ?? path.join(process.cwd(), "data", "cache.sqlite");
}

function getDb(): DatabaseSync {
  if (globalForCache.signalDeskDb) return globalForCache.signalDeskDb;
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  globalForCache.signalDeskDb = db;
  return db;
}

export interface CacheEntry<T> {
  value: T;
  updatedAt: string;
  ageMs: number;
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  const row = getDb()
    .prepare("SELECT payload, updated_at FROM kv WHERE key = ?")
    .get(key) as { payload: string; updated_at: string } | undefined;
  if (!row) return null;
  return {
    value: JSON.parse(row.payload) as T,
    updatedAt: row.updated_at,
    ageMs: Date.now() - new Date(row.updated_at).getTime(),
  };
}

export function writeCache<T>(key: string, value: T, updatedAt = new Date().toISOString()): void {
  getDb()
    .prepare(
      `INSERT INTO kv (key, payload, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    )
    .run(key, JSON.stringify(value), updatedAt);
}

export function isFresh(entry: CacheEntry<unknown> | null, ttlMs: number): entry is CacheEntry<unknown> {
  return Boolean(entry && entry.ageMs >= 0 && entry.ageMs < ttlMs);
}
