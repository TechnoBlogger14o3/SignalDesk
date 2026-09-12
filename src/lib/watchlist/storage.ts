import { WATCHLIST_SYMBOLS } from "@/lib/symbols/catalog";

export const WATCHLIST_KEY = "signaldesk.watchlist";
export const WATCHLIST_LIMIT = 25;
export const WATCHLIST_EVENT = "signaldesk-watchlist";
export const DEFAULT_WATCHLIST = [...WATCHLIST_SYMBOLS];

export function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase().replace(/\.NS$/i, "");
}

export function sanitizeSymbols(values: string[], limit = WATCHLIST_LIMIT): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const symbol = normalizeSymbol(value);
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    out.push(symbol);
    if (out.length >= limit) break;
  }
  return out;
}

export function parseWatchlist(raw: unknown, fallback: string[] = DEFAULT_WATCHLIST): string[] {
  if (!Array.isArray(raw)) return fallback;
  return sanitizeSymbols(raw.filter((item): item is string => typeof item === "string"));
}

export function parseSymbolQuery(raw: string | null, fallback: string[] = DEFAULT_WATCHLIST): string[] {
  if (!raw?.trim()) return fallback;
  return sanitizeSymbols(raw.split(/[,|]/));
}

export function readWatchlist(): string[] {
  if (typeof window === "undefined") return DEFAULT_WATCHLIST;
  try {
    const raw = window.localStorage.getItem(WATCHLIST_KEY);
    if (raw === null) return DEFAULT_WATCHLIST;
    return parseWatchlist(JSON.parse(raw));
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

function persist(symbols: string[]): string[] {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(symbols));
    window.dispatchEvent(new Event(WATCHLIST_EVENT));
  }
  return symbols;
}

export function writeWatchlist(symbols: string[]): string[] {
  return persist(sanitizeSymbols(symbols));
}

export function addToWatchlist(symbol: string, current = readWatchlist()): string[] {
  const next = sanitizeSymbols([symbol, ...current.filter((item) => normalizeSymbol(item) !== normalizeSymbol(symbol))]);
  return persist(next);
}

export function removeFromWatchlist(symbol: string, current = readWatchlist()): string[] {
  return persist(current.filter((item) => normalizeSymbol(item) !== normalizeSymbol(symbol)));
}
