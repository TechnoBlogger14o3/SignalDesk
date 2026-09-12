import YahooFinance from "yahoo-finance2";
import type {
  Candle,
  Fundamentals,
  HistoryOptions,
  MarketDataProvider,
  Quote,
  SearchResult,
} from "@/lib/market-data/types";
import { MarketDataError, UnknownSymbolError } from "@/lib/market-data/errors";
import {
  fromYahooSymbol,
  getInstrument,
  isKnownNseSymbol,
  resolveNseSymbol,
  searchCatalog,
  toYahooSymbol,
} from "@/lib/symbols/catalog";
import { toIstIso } from "@/lib/market-hours";

const yahooFinance = new YahooFinance({
  validation: { logErrors: false, logOptionsErrors: false },
  suppressNotices: ["yahooSurvey"],
});

const NSE_EXCHANGES = new Set(["NSI", "NSE", "NATIONAL STOCK EXCHANGE OF INDIA"]);

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function quoteTime(value: unknown): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const ms = value < 10_000_000_000 ? value * 1000 : value;
    return new Date(ms);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export async function resolveValidatedSymbol(input: string): Promise<string> {
  const local = resolveNseSymbol(input);
  if (local) return local.symbol;

  const trimmed = input.trim().toUpperCase().replace(/\.NS$/i, "");
  if (isKnownNseSymbol(trimmed)) return trimmed;

  const catalogHits = searchCatalog(input, 3);
  if (catalogHits.length === 1) return catalogHits[0].symbol;

  const remote = await searchYahooNse(input);
  const exact = remote.find(
    (item) => item.symbol === trimmed || item.symbol === input.trim().toUpperCase(),
  );
  if (exact) return exact.symbol;
  if (catalogHits[0]) return catalogHits[0].symbol;
  throw new UnknownSymbolError(input);
}

async function searchYahooNse(query: string): Promise<SearchResult[]> {
  try {
    const result = await yahooFinance.search(query, {
      quotesCount: 12,
      newsCount: 0,
      enableFuzzyQuery: true,
    });
    const matches: SearchResult[] = [];
    for (const quote of result.quotes ?? []) {
      const symbol = asString((quote as { symbol?: string }).symbol);
      if (!symbol) continue;
      const exchange = `${asString((quote as { exchange?: string }).exchange) ?? ""} ${asString((quote as { exchDisp?: string }).exchDisp) ?? ""}`.toUpperCase();
      const isNse =
        symbol.toUpperCase().endsWith(".NS") ||
        [...NSE_EXCHANGES].some((code) => exchange.includes(code));
      if (!isNse) continue;
      const nseSymbol = fromYahooSymbol(symbol);
      const instrument = getInstrument(nseSymbol);
      matches.push({
        symbol: nseSymbol,
        name:
          instrument?.name ??
          asString((quote as { shortname?: string }).shortname) ??
          asString((quote as { longname?: string }).longname) ??
          nseSymbol,
        exchange: "NSE",
      });
    }
    return matches;
  } catch {
    return [];
  }
}

export class YahooMarketDataProvider implements MarketDataProvider {
  async getQuote(symbol: string): Promise<Quote> {
    const nseSymbol = await resolveValidatedSymbol(symbol);
    try {
      const raw = await yahooFinance.quote(toYahooSymbol(nseSymbol));
      const price = asNumber(raw.regularMarketPrice);
      if (price === undefined) {
        throw new MarketDataError(`Quote for ${nseSymbol} did not include a price.`);
      }
      const name =
        getInstrument(nseSymbol)?.name ??
        asString(raw.shortName) ??
        asString(raw.longName) ??
        nseSymbol;
      return {
        symbol: nseSymbol,
        exchange: "NSE",
        name,
        price,
        change: asNumber(raw.regularMarketChange) ?? 0,
        changePercent: asNumber(raw.regularMarketChangePercent) ?? 0,
        volume: asNumber(raw.regularMarketVolume),
        previousClose: asNumber(raw.regularMarketPreviousClose),
        dayHigh: asNumber(raw.regularMarketDayHigh),
        dayLow: asNumber(raw.regularMarketDayLow),
        fiftyTwoWeekHigh: asNumber(raw.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: asNumber(raw.fiftyTwoWeekLow),
        currency: "INR",
        timestamp: toIstIso(quoteTime(raw.regularMarketTime)),
      };
    } catch (error) {
      if (error instanceof UnknownSymbolError || error instanceof MarketDataError) throw error;
      throw new MarketDataError(`Unable to retrieve a live quote for ${nseSymbol}.`, error);
    }
  }

  async getHistory(symbol: string, options: HistoryOptions = {}): Promise<Candle[]> {
    const nseSymbol = await resolveValidatedSymbol(symbol);
    const years = options.range === "10y" ? 10 : options.range === "2y" ? 2 : options.range === "1y" ? 1 : 5;
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - years);
    try {
      const chart = await yahooFinance.chart(toYahooSymbol(nseSymbol), {
        period1,
        interval: options.interval ?? "1d",
      });
      const candles: Candle[] = [];
      for (const row of chart.quotes ?? []) {
        const close = asNumber(row.close);
        const open = asNumber(row.open);
        const high = asNumber(row.high);
        const low = asNumber(row.low);
        if (close === undefined || open === undefined || high === undefined || low === undefined) continue;
        const date = row.date instanceof Date ? row.date : new Date(row.date);
        candles.push({
          date: date.toISOString(),
          open,
          high,
          low,
          close,
          volume: asNumber(row.volume) ?? 0,
        });
      }
      if (candles.length < 30) {
        throw new MarketDataError(`Insufficient historical data for ${nseSymbol}.`);
      }
      return candles;
    } catch (error) {
      if (error instanceof UnknownSymbolError || error instanceof MarketDataError) throw error;
      throw new MarketDataError(`Unable to retrieve history for ${nseSymbol}.`, error);
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    const local = searchCatalog(query, 8);
    const known = new Set(local.map((item) => item.symbol));
    try {
      const remote = await searchYahooNse(query);
      for (const item of remote) {
        if (known.has(item.symbol) || local.length >= 8) continue;
        local.push(item);
        known.add(item.symbol);
      }
    } catch {
      // Catalog results are still useful if the remote search fails.
    }
    return local.slice(0, 8);
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    const nseSymbol = await resolveValidatedSymbol(symbol);
    try {
      const summary = await yahooFinance.quoteSummary(toYahooSymbol(nseSymbol), {
        modules: [
          "financialData",
          "defaultKeyStatistics",
          "summaryDetail",
          "summaryProfile",
          "earningsTrend",
        ],
      });
      const financial = summary.financialData;
      const stats = summary.defaultKeyStatistics;
      const detail = summary.summaryDetail;
      const profile = summary.summaryProfile;
      const fundamentals: Fundamentals = { symbol: nseSymbol };
      const revenueGrowth = asNumber(financial?.revenueGrowth);
      const earningsGrowth = asNumber(financial?.earningsGrowth);
      const profitMargins = asNumber(financial?.profitMargins);
      const operatingMargins = asNumber(financial?.operatingMargins);
      const returnOnEquity = asNumber(financial?.returnOnEquity);
      const returnOnAssets = asNumber(financial?.returnOnAssets);
      const debtToEquity = asNumber(financial?.debtToEquity);
      const trailingPE = asNumber(detail?.trailingPE) ?? asNumber(stats?.trailingPE);
      const forwardPE = asNumber(detail?.forwardPE) ?? asNumber(stats?.forwardPE);
      const pegRatio = asNumber(stats?.pegRatio);
      const bookValue = asNumber(stats?.bookValue);
      const priceToBook = asNumber(stats?.priceToBook);
      const enterpriseToEbitda = asNumber(stats?.enterpriseToEbitda);
      const currentRatio = asNumber(financial?.currentRatio);
      const targetMeanPrice = asNumber(financial?.targetMeanPrice);
      const recommendationKey = asString(financial?.recommendationKey);
      const sector = asString(profile?.sector);
      const industry = asString(profile?.industry);

      if (revenueGrowth !== undefined) fundamentals.revenueGrowth = revenueGrowth;
      if (earningsGrowth !== undefined) fundamentals.earningsGrowth = earningsGrowth;
      if (profitMargins !== undefined) fundamentals.profitMargins = profitMargins;
      if (operatingMargins !== undefined) fundamentals.operatingMargins = operatingMargins;
      if (returnOnEquity !== undefined) fundamentals.returnOnEquity = returnOnEquity;
      if (returnOnAssets !== undefined) fundamentals.returnOnAssets = returnOnAssets;
      if (debtToEquity !== undefined) fundamentals.debtToEquity = debtToEquity;
      if (trailingPE !== undefined) fundamentals.trailingPE = trailingPE;
      if (forwardPE !== undefined) fundamentals.forwardPE = forwardPE;
      if (pegRatio !== undefined) fundamentals.pegRatio = pegRatio;
      if (bookValue !== undefined) fundamentals.bookValue = bookValue;
      if (priceToBook !== undefined) fundamentals.priceToBook = priceToBook;
      if (enterpriseToEbitda !== undefined) fundamentals.enterpriseToEbitda = enterpriseToEbitda;
      if (currentRatio !== undefined) fundamentals.currentRatio = currentRatio;
      if (targetMeanPrice !== undefined) fundamentals.targetMeanPrice = targetMeanPrice;
      if (recommendationKey) fundamentals.recommendationKey = recommendationKey;
      if (sector) fundamentals.sector = sector;
      if (industry) fundamentals.industry = industry;

      const keys = Object.keys(fundamentals).filter((key) => key !== "symbol");
      return keys.length === 0 ? null : fundamentals;
    } catch {
      return null;
    }
  }
}
