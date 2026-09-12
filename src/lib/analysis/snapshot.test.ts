import { describe, expect, it } from "vitest";
import { analyzeSnapshot } from "@/lib/analysis/snapshot";
import { estimateHorizon } from "@/lib/analysis/targets";
import type { Candle, Quote } from "@/lib/market-data/types";

function risingSeries(days = 260): Candle[] {
  const candles: Candle[] = [];
  let price = 100;
  for (let i = 0; i < days; i += 1) {
    price *= 1.004;
    const open = price * 0.995;
    const close = price;
    const high = close * 1.01;
    const low = open * 0.99;
    candles.push({
      date: `2025-01-01T00:00:00Z`,
      open,
      high,
      low,
      close,
      volume: 1_000_000 + (i % 5) * 50_000,
    });
  }
  return candles;
}

describe("analysis snapshot", () => {
  it("produces targets above the current price for an uptrend", () => {
    const candles = risingSeries();
    const price = candles[candles.length - 1].close;
    const quote: Quote = {
      symbol: "HDFCBANK",
      exchange: "NSE",
      name: "HDFC Bank",
      price,
      change: 1,
      changePercent: 1,
      currency: "INR",
      timestamp: "2026-09-10T10:30:00+05:30",
    };
    const analysis = analyzeSnapshot(quote, candles, {
      symbol: "HDFCBANK",
      revenueGrowth: 0.14,
      earningsGrowth: 0.16,
      profitMargins: 0.22,
      operatingMargins: 0.24,
      returnOnEquity: 0.16,
      debtToEquity: 40,
      trailingPE: 20,
      forwardPE: 18,
    });
    expect(analysis).not.toBeNull();
    expect(analysis!.targets.t1.price).toBeGreaterThan(price);
    expect(analysis!.targets.t2.price).toBeGreaterThanOrEqual(analysis!.targets.t1.price);
    expect(analysis!.targets.longTerm.price).toBeGreaterThan(analysis!.targets.t2.price);
    expect(analysis!.scores.technical).toBeGreaterThan(50);
    expect(analysis!.scores.fundamental).toBeGreaterThan(50);
    expect(analysis!.entry.signal).toBeTruthy();
  });
});

describe("target months", () => {
  it("returns the next month for a near-term target from mid-September", () => {
    const label = estimateHorizon(40, 10, "t1", new Date("2026-09-10T10:00:00+05:30"));
    expect(label).toBe("Oct 2026");
  });

  it("returns a multi-year range for long-term targets", () => {
    const label = estimateHorizon(400, 10, "lt", new Date("2026-09-10T10:00:00+05:30"));
    expect(label).toBe("2029–2031");
  });
});
