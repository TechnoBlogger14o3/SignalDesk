import { TEST_HOLDINGS, type Holding } from "@/lib/portfolio/holdings";
import { normalizeSymbol } from "@/lib/watchlist/storage";

export const PORTFOLIO_KEY = "signaldesk.portfolio";
export const PORTFOLIO_EVENT = "signaldesk-portfolio";
export const PORTFOLIO_LIMIT = 30;
export const DEFAULT_HOLDINGS = TEST_HOLDINGS;

export function sanitizeHolding(input: Partial<Holding>): Holding | null {
  const symbol = normalizeSymbol(input.symbol ?? "");
  const shares = Number(input.shares);
  const averagePrice = Number(input.averagePrice);
  if (!symbol || !Number.isFinite(shares) || shares <= 0) return null;
  if (!Number.isFinite(averagePrice) || averagePrice <= 0) return null;
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : symbol;
  return { symbol, name, shares, averagePrice };
}

export function parseHoldings(raw: unknown, fallback: Holding[] = DEFAULT_HOLDINGS): Holding[] {
  if (!Array.isArray(raw)) return fallback;
  return raw
    .map((item) => sanitizeHolding(item as Partial<Holding>))
    .filter((item): item is Holding => item !== null)
    .slice(0, PORTFOLIO_LIMIT);
}

export function parseLotsQuery(raw: string | null): Holding[] | null {
  if (raw === null) return null;
  if (!raw.trim()) return [];
  const holdings = raw.split("|").flatMap((part) => {
    const [symbol, shares, averagePrice] = part.split(":");
    const holding = sanitizeHolding({ symbol, shares: Number(shares), averagePrice: Number(averagePrice) });
    return holding ? [holding] : [];
  });
  return holdings.slice(0, PORTFOLIO_LIMIT);
}

export function encodeLotsQuery(holdings: Holding[]): string {
  return holdings.map((holding) => `${holding.symbol}:${holding.shares}:${holding.averagePrice}`).join("|");
}

export function upsertHolding(current: Holding[], incoming: Partial<Holding>): Holding[] {
  const holding = sanitizeHolding(incoming);
  if (!holding) return current;
  const rest = current.filter((item) => item.symbol !== holding.symbol);
  return [holding, ...rest].slice(0, PORTFOLIO_LIMIT);
}

export function removeHolding(current: Holding[], symbol: string): Holding[] {
  return current.filter((item) => item.symbol !== normalizeSymbol(symbol));
}

export function readHoldings(): Holding[] {
  if (typeof window === "undefined") return DEFAULT_HOLDINGS;
  try {
    const raw = window.localStorage.getItem(PORTFOLIO_KEY);
    if (raw === null) return DEFAULT_HOLDINGS;
    return parseHoldings(JSON.parse(raw));
  } catch {
    return DEFAULT_HOLDINGS;
  }
}

export function writeHoldings(holdings: Holding[]): Holding[] {
  const next = parseHoldings(holdings, []);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PORTFOLIO_EVENT));
  }
  return next;
}
