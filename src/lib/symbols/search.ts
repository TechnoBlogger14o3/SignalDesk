import type { SearchResult } from "@/lib/market-data/types";

const NSE_EXCHANGES = ["NSI", "NSE", "NATIONAL STOCK EXCHANGE OF INDIA"];

export function isNseListedQuote(quote: {
  symbol?: string;
  exchange?: string;
  exchDisp?: string;
  quoteType?: string;
  typeDisp?: string;
}): boolean {
  const symbol = (quote.symbol ?? "").toUpperCase();
  const exchange = `${quote.exchange ?? ""} ${quote.exchDisp ?? ""}`.toUpperCase();
  const type = `${quote.quoteType ?? ""} ${quote.typeDisp ?? ""}`.toUpperCase();
  if (symbol.endsWith(".NS")) return true;
  if (NSE_EXCHANGES.some((code) => exchange.includes(code))) return true;
  return (type.includes("ETF") || type.includes("EQUITY")) && exchange.includes("INDIA");
}

export function mergeSearchResults(
  local: SearchResult[],
  remote: SearchResult[],
  limit = 10,
): SearchResult[] {
  const merged: SearchResult[] = [];
  const seen = new Set<string>();
  for (const item of [...local, ...remote]) {
    if (seen.has(item.symbol)) continue;
    seen.add(item.symbol);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}
