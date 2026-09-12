import type { Candle } from "@/lib/market-data/types";
import { ema } from "@/lib/analysis/indicators";

export type ChartStyle = "candles" | "hollow" | "bars" | "line" | "area" | "baseline" | "heikin";
export type ChartRange = "1M" | "3M" | "6M" | "1Y" | "2Y" | "5Y" | "ALL";
export type ChartInterval = "D" | "W";

export const CHART_STYLES: { id: ChartStyle; label: string }[] = [
  { id: "candles", label: "Candles" },
  { id: "hollow", label: "Hollow candles" },
  { id: "bars", label: "Bars" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "baseline", label: "Baseline" },
  { id: "heikin", label: "Heikin Ashi" },
];

export const CHART_RANGES: ChartRange[] = ["1M", "3M", "6M", "1Y", "2Y", "5Y", "ALL"];

const RANGE_BARS: Record<ChartRange, number | null> = {
  "1M": 22,
  "3M": 66,
  "6M": 132,
  "1Y": 252,
  "2Y": 504,
  "5Y": 1260,
  ALL: null,
};

export function heikinAshi(candles: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i += 1) {
    const current = candles[i];
    const close = (current.open + current.high + current.low + current.close) / 4;
    const open =
      i === 0 ? (current.open + current.close) / 2 : (out[i - 1].open + out[i - 1].close) / 2;
    out.push({
      date: current.date,
      open,
      close,
      high: Math.max(current.high, open, close),
      low: Math.min(current.low, open, close),
      volume: current.volume,
    });
  }
  return out;
}

export function weekKey(dateValue: string): string {
  const date = new Date(dateValue);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function aggregateWeekly(candles: Candle[]): Candle[] {
  const groups = new Map<string, Candle[]>();
  const order: string[] = [];
  for (const candle of candles) {
    const key = weekKey(candle.date);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(candle);
  }
  return order.map((key) => {
    const bars = groups.get(key)!;
    return {
      date: bars[bars.length - 1].date,
      open: bars[0].open,
      high: Math.max(...bars.map((bar) => bar.high)),
      low: Math.min(...bars.map((bar) => bar.low)),
      close: bars[bars.length - 1].close,
      volume: bars.reduce((sum, bar) => sum + bar.volume, 0),
    };
  });
}

export function sliceRange(candles: Candle[], range: ChartRange): Candle[] {
  const count = RANGE_BARS[range];
  if (!count || candles.length <= count) return candles;
  return candles.slice(-count);
}

export function prepareSeries(
  candles: Candle[],
  options: { range: ChartRange; interval: ChartInterval; style: ChartStyle },
): Candle[] {
  const sliced = sliceRange(candles, options.range);
  const intervalBars = options.interval === "W" ? aggregateWeekly(sliced) : sliced;
  return options.style === "heikin" ? heikinAshi(intervalBars) : intervalBars;
}

export type ChartTime = string;

export interface ChartLevel {
  label: string;
  price: number;
  color: string;
}

export interface OverlayPoint {
  time: ChartTime;
  value: number;
}

export function toChartTime(dateValue: string): ChartTime {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

export function uniqueByTime<T extends { time: ChartTime }>(items: T[]): T[] {
  const seen = new Set<ChartTime>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.time)) continue;
    seen.add(item.time);
    out.push(item);
  }
  return out;
}

export function overlayEma(candles: Candle[], period: number): OverlayPoint[] {
  const values = ema(
    candles.map((candle) => candle.close),
    period,
  );
  return uniqueByTime(
    candles.flatMap((candle, index) => {
      const value = values[index];
      if (value === undefined || !Number.isFinite(value)) return [];
      return [{ time: toChartTime(candle.date), value }];
    }),
  );
}

export function toOhlc(candles: Candle[]) {
  return uniqueByTime(
    candles.map((candle) => ({
      time: toChartTime(candle.date),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    })),
  );
}

export function toCloseLine(candles: Candle[]) {
  return uniqueByTime(
    candles.map((candle) => ({
      time: toChartTime(candle.date),
      value: candle.close,
    })),
  );
}

export function toVolume(candles: Candle[]) {
  return uniqueByTime(
    candles.map((candle, index) => {
      const prev = candles[index - 1]?.close ?? candle.open;
      return {
        time: toChartTime(candle.date),
        value: candle.volume,
        color: candle.close >= prev ? "rgba(52, 211, 153, 0.5)" : "rgba(248, 113, 113, 0.5)",
      };
    }),
  );
}
