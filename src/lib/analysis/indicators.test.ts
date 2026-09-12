import { describe, expect, it } from "vitest";
import { atr, ema, findSwingPoints, rsi, sma } from "@/lib/analysis/indicators";
import type { Candle } from "@/lib/market-data/types";

describe("sma", () => {
  it("computes a 3-period simple moving average", () => {
    const result = sma([1, 2, 3, 4, 5], 3);
    expect(result[2]).toBeCloseTo(2);
    expect(result[3]).toBeCloseTo(3);
    expect(result[4]).toBeCloseTo(4);
  });
});

describe("ema", () => {
  it("seeds with SMA then applies the EMA recurrence", () => {
    const result = ema([1, 2, 3, 4, 5], 3);
    expect(result[2]).toBeCloseTo(2);
    expect(result[3]).toBeCloseTo(3);
    expect(result[4]).toBeCloseTo(4);
  });
});

describe("rsi", () => {
  it("returns 100 when there are only advances over the window", () => {
    const values = Array.from({ length: 20 }, (_, i) => i + 1);
    const result = rsi(values, 14);
    expect(result[14]).toBe(100);
  });

  it("returns a mid-range RSI for an oscillating series", () => {
    const values = [10, 11, 12, 11, 10, 11, 13, 12, 11, 12, 14, 13, 12, 13, 15, 14, 13, 14, 16];
    const result = rsi(values, 14);
    const latest = result[result.length - 1];
    expect(latest).toBeGreaterThan(40);
    expect(latest).toBeLessThan(80);
  });
});

describe("atr", () => {
  it("uses true range including gaps", () => {
    const candles: Candle[] = [
      { date: "1", open: 10, high: 12, low: 9, close: 11, volume: 100 },
      { date: "2", open: 14, high: 15, low: 13, close: 14, volume: 100 },
    ];
    const trSeries = atr(
      [
        ...candles,
        ...Array.from({ length: 13 }, (_, i) => ({
          date: String(i + 3),
          open: 14,
          high: 15,
          low: 13,
          close: 14,
          volume: 100,
        })),
      ],
      14,
    );
    expect(trSeries[13]).toBeGreaterThan(1);
  });
});

describe("swing points", () => {
  it("identifies a local high and low", () => {
    const candles: Candle[] = [];
    for (let i = 0; i < 20; i += 1) {
      const close = i === 10 ? 20 : i === 5 ? 1 : 10;
      candles.push({
        date: String(i),
        open: close,
        high: close + (i === 10 ? 0 : 0.2),
        low: close - (i === 5 ? 0 : 0.2),
        close,
        volume: 1,
      });
    }
    const swings = findSwingPoints(candles, 3);
    expect(swings.highs.some((value) => value >= 20)).toBe(true);
    expect(swings.lows.some((value) => value <= 1)).toBe(true);
  });
});
