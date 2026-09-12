import { analyzeSnapshot } from "@/lib/analysis/snapshot";
import { isFresh, readCache, writeCache } from "@/lib/market-data/cache";
import { isUnknownSymbolError, MarketDataError } from "@/lib/market-data/errors";
import { getMarketDataProvider } from "@/lib/market-data/provider";
import type {
  Candle,
  Fundamentals,
  Quote,
  QuoteResponse,
  SearchResult,
  Snapshot,
} from "@/lib/market-data/types";
import { formatIstTimestamp, getMarketClock, historyCacheTtlMs, quoteCacheTtlMs } from "@/lib/market-hours";
import { WATCHLIST_SYMBOLS, getInstrument, resolveNseSymbol } from "@/lib/symbols/catalog";
import { sanitizeSymbols } from "@/lib/watchlist/storage";

function toQuoteResponse(
  quote: Quote,
  options: { stale: boolean; lastSuccessfulUpdate: string; error?: string },
): QuoteResponse {
  const clock = getMarketClock();
  return {
    ...quote,
    marketStatus: clock.status,
    isLive: clock.isOpen && !options.stale && !options.error,
    stale: options.stale,
    lastSuccessfulUpdate: options.lastSuccessfulUpdate,
    error: options.error,
  };
}

function cacheSymbol(symbol: string): string {
  return (resolveNseSymbol(symbol)?.symbol ?? symbol).toUpperCase();
}

export async function getQuote(symbol: string, refresh = false): Promise<QuoteResponse> {
  const cacheKey = `quote:${cacheSymbol(symbol)}`;
  const cached = readCache<Quote>(cacheKey);
  if (!refresh && isFresh(cached, quoteCacheTtlMs())) {
    return toQuoteResponse(cached.value, {
      stale: false,
      lastSuccessfulUpdate: cached.updatedAt,
    });
  }

  try {
    const quote = await getMarketDataProvider().getQuote(symbol);
    writeCache(cacheKey, quote);
    return toQuoteResponse(quote, { stale: false, lastSuccessfulUpdate: new Date().toISOString() });
  } catch (error) {
    if (isUnknownSymbolError(error)) throw error;
    if (cached) {
      return toQuoteResponse(cached.value, {
        stale: true,
        lastSuccessfulUpdate: cached.updatedAt,
        error: "Market data temporarily unavailable.",
      });
    }
    throw error instanceof MarketDataError
      ? error
      : new MarketDataError("Market data temporarily unavailable.", error);
  }
}

export async function getHistory(symbol: string, refresh = false): Promise<Candle[]> {
  const cacheKey = `history:${cacheSymbol(symbol)}`;
  const cached = readCache<Candle[]>(cacheKey);
  if (!refresh && isFresh(cached, historyCacheTtlMs())) {
    return cached.value;
  }
  try {
    const history = await getMarketDataProvider().getHistory(symbol, { range: "5y", interval: "1d" });
    writeCache(cacheKey, history);
    return history;
  } catch (error) {
    if (isUnknownSymbolError(error)) throw error;
    if (cached) return cached.value;
    throw error instanceof MarketDataError
      ? error
      : new MarketDataError("Historical market data temporarily unavailable.", error);
  }
}

async function getFundamentals(symbol: string, refresh = false): Promise<Fundamentals | null> {
  const cacheKey = `fundamentals:${cacheSymbol(symbol)}`;
  const cached = readCache<Fundamentals | null>(cacheKey);
  if (!refresh && isFresh(cached, 24 * 60 * 60 * 1000)) {
    return cached.value;
  }
  try {
    const fundamentals = await getMarketDataProvider().getFundamentals(symbol);
    writeCache(cacheKey, fundamentals);
    return fundamentals;
  } catch {
    return cached?.value ?? null;
  }
}

export async function getSnapshot(
  symbol: string,
  options: { refresh?: boolean; includeCandles?: boolean } = {},
): Promise<Snapshot> {
  const [quote, candles, fundamentals] = await Promise.all([
    getQuote(symbol, options.refresh),
    getHistory(symbol, options.refresh),
    getFundamentals(symbol, options.refresh),
  ]);
  const analysis = analyzeSnapshot(quote, candles, fundamentals);
  return {
    symbol: quote.symbol,
    name: quote.name,
    exchange: "NSE",
    quote,
    analysis,
    candles: options.includeCandles ? candles : undefined,
  };
}

async function mapPool<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit).map((item) => fn(item));
    results.push(...(await Promise.allSettled(batch)));
  }
  return results;
}

export async function getWatchlist(refresh = false, symbols: readonly string[] = WATCHLIST_SYMBOLS): Promise<Snapshot[]> {
  const list = sanitizeSymbols([...symbols]);
  if (list.length === 0) return [];
  const results = await mapPool(list, 3, (symbol) => getSnapshot(symbol, { refresh }));
  return results.flatMap((result, index) => {
    if (result.status === "fulfilled") return [result.value];
    const symbol = list[index];
    const instrument = getInstrument(symbol);
    const cachedQuote = readCache<Quote>(`quote:${symbol}`);
    if (!cachedQuote) return [];
    return [
      {
        symbol,
        name: instrument?.name ?? symbol,
        exchange: "NSE" as const,
        quote: toQuoteResponse(cachedQuote.value, {
          stale: true,
          lastSuccessfulUpdate: cachedQuote.updatedAt,
          error: "Market data temporarily unavailable.",
        }),
        analysis: null,
      },
    ];
  });
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  return getMarketDataProvider().search(query);
}

export function publicQuotePayload(quote: QuoteResponse) {
  return {
    symbol: quote.symbol,
    exchange: quote.exchange,
    name: quote.name,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    volume: quote.volume,
    timestamp: quote.timestamp,
    marketStatus: quote.marketStatus,
    isLive: quote.isLive,
    stale: quote.stale,
    lastSuccessfulUpdate: quote.lastSuccessfulUpdate,
    lastSuccessfulUpdateLabel: formatIstTimestamp(quote.lastSuccessfulUpdate),
    error: quote.error,
  };
}
