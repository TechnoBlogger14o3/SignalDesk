import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { writeCache } from "@/lib/market-data/cache";
import type { Quote } from "@/lib/market-data/types";

const cachedQuote: Quote = {
  symbol: "HDFCBANK",
  exchange: "NSE",
  name: "HDFC Bank",
  price: 693.8,
  change: 6.7,
  changePercent: 0.97,
  currency: "INR",
  timestamp: "2026-09-10T15:14:59+05:30",
};

describe("cached quote fallback", () => {
  const previousProvider = process.env.MARKET_DATA_PROVIDER;
  const previousBase = process.env.MARKET_DATA_BASE_URL;
  const previousCache = process.env.MARKET_DATA_CACHE_PATH;

  beforeEach(() => {
    process.env.MARKET_DATA_CACHE_PATH = path.join(os.tmpdir(), `signaldesk-test-${Date.now()}.sqlite`);
    process.env.MARKET_DATA_PROVIDER = "rest";
    process.env.MARKET_DATA_BASE_URL = "http://127.0.0.1:1";
  });

  afterEach(() => {
    process.env.MARKET_DATA_PROVIDER = previousProvider;
    process.env.MARKET_DATA_BASE_URL = previousBase;
    process.env.MARKET_DATA_CACHE_PATH = previousCache;
  });

  it("returns the last available price when the provider is down", async () => {
    writeCache("quote:HDFCBANK", cachedQuote, "2026-09-10T09:59:00.000Z");
    const { getQuote } = await import("@/lib/market-data/service");
    const quote = await getQuote("HDFCBANK", true);
    expect(quote.price).toBe(693.8);
    expect(quote.stale).toBe(true);
    expect(quote.error).toBe("Market data temporarily unavailable.");
    expect(quote.isLive).toBe(false);
  });
});
