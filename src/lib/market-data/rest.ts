import type {
  Candle,
  Fundamentals,
  HistoryOptions,
  MarketDataProvider,
  Quote,
  SearchResult,
} from "@/lib/market-data/types";
import { MarketDataError, UnknownSymbolError } from "@/lib/market-data/errors";
import { resolveNseSymbol, searchCatalog } from "@/lib/symbols/catalog";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new MarketDataError(`${name} is required when MARKET_DATA_PROVIDER=rest.`);
  }
  return value;
}

export class RestMarketDataProvider implements MarketDataProvider {
  private get baseUrl() {
    return requiredEnv("MARKET_DATA_BASE_URL").replace(/\/$/, "");
  }

  private headers() {
    const headers: Record<string, string> = { Accept: "application/json" };
    const apiKey = process.env.MARKET_DATA_API_KEY;
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    return headers;
  }

  private async getJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers(),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 404) throw new UnknownSymbolError(path);
    if (!response.ok) {
      throw new MarketDataError(`Market data provider returned ${response.status}.`);
    }
    return (await response.json()) as T;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const resolved = resolveNseSymbol(symbol)?.symbol ?? symbol.toUpperCase();
    return this.getJson<Quote>(`/quote/${encodeURIComponent(resolved)}`);
  }

  async getHistory(symbol: string, options: HistoryOptions = {}): Promise<Candle[]> {
    const resolved = resolveNseSymbol(symbol)?.symbol ?? symbol.toUpperCase();
    const params = new URLSearchParams();
    if (options.range) params.set("range", options.range);
    if (options.interval) params.set("interval", options.interval);
    const query = params.toString();
    return this.getJson<Candle[]>(`/history/${encodeURIComponent(resolved)}${query ? `?${query}` : ""}`);
  }

  async search(query: string): Promise<SearchResult[]> {
    const local = searchCatalog(query);
    try {
      const remote = await this.getJson<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
      const known = new Set(local.map((item) => item.symbol));
      for (const item of remote) {
        if (!known.has(item.symbol)) local.push(item);
      }
    } catch {
      // Keep local catalog results.
    }
    return local.slice(0, 8);
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    const resolved = resolveNseSymbol(symbol)?.symbol ?? symbol.toUpperCase();
    try {
      return await this.getJson<Fundamentals>(`/fundamentals/${encodeURIComponent(resolved)}`);
    } catch {
      return null;
    }
  }
}
