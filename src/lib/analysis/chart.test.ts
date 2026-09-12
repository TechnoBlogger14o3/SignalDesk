import { describe, expect, it } from "vitest";
import {
  aggregateWeekly,
  heikinAshi,
  overlayEma,
  sliceRange,
  toChartTime,
  toOhlc,
  type ChartRange,
} from "@/lib/analysis/chart";
import type { Candle } from "@/lib/market-data/types";

function bar(date: string, open: number, high: number, low: number, close: number): Candle {
  return { date, open, high, low, close, volume: 100 };
}

describe("heikin ashi", () => {
  it("averages the first bar and smooths the next open", () => {
    const ha = heikinAshi([
      bar("2026-01-01", 10, 12, 9, 11),
      bar("2026-01-02", 11, 14, 10, 13),
    ]);
    expect(ha[0].close).toBeCloseTo((10 + 12 + 9 + 11) / 4);
    expect(ha[0].open).toBeCloseTo((10 + 11) / 2);
    expect(ha[1].open).toBeCloseTo((ha[0].open + ha[0].close) / 2);
    expect(ha[1].high).toBeGreaterThanOrEqual(Math.max(ha[1].open, ha[1].close));
    expect(ha[1].low).toBeLessThanOrEqual(Math.min(ha[1].open, ha[1].close));
  });
});

describe("weekly aggregation", () => {
  it("rolls five daily bars into one weekly candle", () => {
    const daily = [
      bar("2026-09-07T00:00:00.000Z", 100, 102, 99, 101),
      bar("2026-09-08T00:00:00.000Z", 101, 105, 100, 104),
      bar("2026-09-09T00:00:00.000Z", 104, 106, 103, 103),
      bar("2026-09-10T00:00:00.000Z", 103, 104, 101, 102),
      bar("2026-09-11T00:00:00.000Z", 102, 108, 102, 107),
    ];
    const weekly = aggregateWeekly(daily);
    expect(weekly).toHaveLength(1);
    expect(weekly[0].open).toBe(100);
    expect(weekly[0].high).toBe(108);
    expect(weekly[0].low).toBe(99);
    expect(weekly[0].close).toBe(107);
    expect(weekly[0].volume).toBe(500);
  });
});

describe("range slice", () => {
  it("keeps the last year of daily bars", () => {
    const candles = Array.from({ length: 400 }, (_, i) =>
      bar(`2025-01-01T00:00:00.000Z`, 100 + i, 101 + i, 99 + i, 100 + i),
    );
    const year = sliceRange(candles, "1Y");
    expect(year.length).toBe(252);
  });

  it("returns all bars for ALL", () => {
    const candles = Array.from({ length: 10 }, (_, i) => bar(String(i), 1, 2, 0, 1));
    expect(sliceRange(candles, "ALL" as ChartRange).length).toBe(10);
  });
});

describe("chart time and overlays", () => {
  it("normalizes ISO timestamps to YYYY-MM-DD", () => {
    expect(toChartTime("2026-09-10T03:45:00.000Z")).toBe("2026-09-10");
  });

  it("builds EMA points only after the warm-up period", () => {
    const candles = Array.from({ length: 5 }, (_, i) =>
      bar(`2026-01-0${i + 1}T00:00:00.000Z`, 10 + i, 11 + i, 9 + i, 10 + i),
    );
    const points = overlayEma(candles, 3);
    expect(points).toHaveLength(3);
    expect(points[0].time).toBe("2026-01-03");
    expect(points.every((point) => Number.isFinite(point.value))).toBe(true);
  });

  it("keeps a unique time per OHLC bar", () => {
    const ohlc = toOhlc([
      bar("2026-01-01T00:00:00.000Z", 1, 2, 0, 1),
      bar("2026-01-01T00:00:00.000Z", 2, 3, 1, 2),
    ]);
    expect(ohlc).toHaveLength(1);
  });
});
