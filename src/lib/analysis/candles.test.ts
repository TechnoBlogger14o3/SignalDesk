import { describe, expect, it } from "vitest";
import { detectCandlePatterns } from "@/lib/analysis/candles";
import type { Candle } from "@/lib/market-data/types";

function bar(date: string, open: number, high: number, low: number, close: number): Candle {
  return { date, open, high, low, close, volume: 1_000_000 };
}

describe("candlestick patterns", () => {
  it("detects a hammer after a decline", () => {
    const candles = [
      bar("1", 110, 111, 108, 109),
      bar("2", 109, 109.5, 106, 107),
      bar("3", 107, 107.5, 103, 104),
      bar("4", 104, 105.2, 98, 104.8),
    ];
    const found = detectCandlePatterns(candles);
    expect(found.some((item) => item.name === "Hammer" && item.bias === "Bullish")).toBe(true);
  });

  it("detects a shooting star after a rally", () => {
    const candles = [
      bar("1", 100, 102, 99, 101),
      bar("2", 101, 104, 100.5, 103),
      bar("3", 103, 106, 102.5, 105),
      bar("4", 105, 112, 104.6, 105.4),
    ];
    const found = detectCandlePatterns(candles);
    expect(found.some((item) => item.name === "Shooting Star" && item.bias === "Bearish")).toBe(true);
  });

  it("detects a bullish engulfing pair", () => {
    const candles = [
      bar("1", 110, 111, 107, 108),
      bar("2", 108, 108.5, 104, 105),
      bar("3", 104.5, 111, 104, 110.5),
    ];
    const found = detectCandlePatterns(candles);
    expect(found.some((item) => item.name === "Bullish Engulfing")).toBe(true);
  });

  it("detects a bearish engulfing pair", () => {
    const candles = [
      bar("1", 100, 103, 99, 102),
      bar("2", 102, 106, 101, 105),
      bar("3", 106, 106.5, 99, 100),
    ];
    const found = detectCandlePatterns(candles);
    expect(found.some((item) => item.name === "Bearish Engulfing")).toBe(true);
  });

  it("detects a doji", () => {
    const candles = [bar("1", 100, 104, 96, 100.1)];
    const found = detectCandlePatterns(candles);
    expect(found.some((item) => item.name === "Doji")).toBe(true);
  });

  it("detects a morning star", () => {
    const candles = [
      bar("1", 112, 113, 106, 107),
      bar("2", 106.5, 107.2, 104.8, 105.4),
      bar("3", 106, 112, 105.5, 111),
    ];
    const found = detectCandlePatterns(candles);
    expect(found.some((item) => item.name === "Morning Star")).toBe(true);
  });

  it("does not label a wide-range trend bar as a hammer", () => {
    const candles = [bar("1", 100, 108, 99, 107)];
    const found = detectCandlePatterns(candles);
    expect(found.some((item) => item.name === "Hammer")).toBe(false);
  });
});
