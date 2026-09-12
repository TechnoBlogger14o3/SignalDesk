import { describe, expect, it } from "vitest";
import { buildEntryPlan } from "@/lib/analysis/entry";
import type { CandlePattern } from "@/lib/analysis/candles";
import type { TechnicalIndicators } from "@/lib/market-data/types";

const broken: TechnicalIndicators = {
  ema20: 720,
  ema50: 740,
  ema200: 760,
  rsi14: 38,
  atr14: 12,
  atrPercent: 1.8,
  swingHighs: [780],
  swingLows: [650],
  support: [700],
  resistance: [780],
  trend: "Strong Downtrend",
  momentum: "Weak",
  patterns: [],
};

const uptrend: TechnicalIndicators = {
  ema20: 98,
  ema50: 96,
  ema200: 90,
  rsi14: 55,
  atr14: 2,
  atrPercent: 2,
  swingHighs: [110],
  swingLows: [85],
  support: [88],
  resistance: [108],
  trend: "Uptrend",
  momentum: "Positive",
  patterns: [],
};

function pattern(name: CandlePattern["name"], bias: CandlePattern["bias"]): CandlePattern {
  return {
    name,
    bias,
    bars: 1,
    index: 10,
    date: "2026-09-10",
    barsAgo: 0,
    reliability: "High",
  };
}

describe("entry engine", () => {
  it("does not force EXIT on a quality name in a drawdown", () => {
    const plan = buildEntryPlan(693, broken, 33, 78);
    expect(plan.signal).toBe("ACCUMULATE");
  });

  it("uses EXIT when both trend and fundamentals have deteriorated", () => {
    const plan = buildEntryPlan(693, broken, 28, 30);
    expect(plan.signal).toBe("EXIT");
  });

  it("upgrades a constructive trend to ENTRY NOW when a hammer prints", () => {
    const without = buildEntryPlan(100, uptrend, 50, 70);
    expect(without.signal).toBe("HOLD");
    const withHammer = buildEntryPlan(100, uptrend, 50, 70, [pattern("Hammer", "Bullish")]);
    expect(withHammer.signal).toBe("ENTRY NOW");
    expect(withHammer.explanation).toMatch(/Hammer/i);
  });

  it("treats a shooting star in an uptrend as BUY ON DIP rather than chasing", () => {
    const withStar = buildEntryPlan(100, uptrend, 50, 70, [pattern("Shooting Star", "Bearish")]);
    expect(withStar.signal).toBe("BUY ON DIP");
    expect(withStar.explanation).toMatch(/Shooting Star/i);
  });
});
