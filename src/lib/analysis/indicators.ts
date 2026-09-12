import type { Candle, TechnicalIndicators, TrendDirection, MomentumLabel } from "@/lib/market-data/types";
import { detectCandlePatterns } from "@/lib/analysis/candles";

export function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  if (period <= 0) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  if (values.length < period || period <= 0) return out;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i += 1) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function rsi(values: number[], period = 14): number[] {
  const out: number[] = [];
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const delta = values[i] - values[i - 1];
    if (delta >= 0) gain += delta;
    else loss -= delta;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i += 1) {
    const delta = values[i] - values[i - 1];
    const curGain = delta > 0 ? delta : 0;
    const curLoss = delta < 0 ? -delta : 0;
    avgGain = (avgGain * (period - 1) + curGain) / period;
    avgLoss = (avgLoss * (period - 1) + curLoss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function trueRange(candles: Candle[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < candles.length; i += 1) {
    const { high, low } = candles[i];
    if (i === 0) {
      out[i] = high - low;
      continue;
    }
    const prevClose = candles[i - 1].close;
    out[i] = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }
  return out;
}

export function atr(candles: Candle[], period = 14): number[] {
  const tr = trueRange(candles);
  const out: number[] = [];
  if (tr.length < period) return out;
  let prev = tr.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < tr.length; i += 1) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }
  return out;
}

export function lastDefined(values: Array<number | undefined>): number | undefined {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = values[i];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function uniqueSorted(values: number[], descending = false): number[] {
  const rounded = [...new Set(values.map((value) => Math.round(value * 100) / 100))];
  rounded.sort((a, b) => (descending ? b - a : a - b));
  return rounded;
}

export function findSwingPoints(candles: Candle[], lookback = 5): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  if (candles.length < lookback * 2 + 1) return { highs, lows };
  for (let i = lookback; i < candles.length - lookback; i += 1) {
    const high = candles[i].high;
    const low = candles[i].low;
    let isHigh = true;
    let isLow = true;
    for (let j = i - lookback; j <= i + lookback; j += 1) {
      if (j === i) continue;
      if (candles[j].high >= high) isHigh = false;
      if (candles[j].low <= low) isLow = false;
    }
    if (isHigh) highs.push(high);
    if (isLow) lows.push(low);
  }
  return { highs, lows };
}

function clusterLevels(levels: number[], threshold: number): number[] {
  if (levels.length === 0) return [];
  const sorted = [...levels].sort((a, b) => a - b);
  const clusters: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = clusters[clusters.length - 1][0];
    if (Math.abs(sorted[i] - prev) <= threshold) clusters[clusters.length - 1].push(sorted[i]);
    else clusters.push([sorted[i]]);
  }
  return clusters
    .map((cluster) => cluster.reduce((sum, value) => sum + value, 0) / cluster.length)
    .sort((a, b) => a - b);
}

export function classifyTrend(price: number, ema20?: number, ema50?: number, ema200?: number): TrendDirection {
  if (ema20 !== undefined && ema50 !== undefined && ema200 !== undefined) {
    if (price > ema20 && ema20 > ema50 && ema50 > ema200) return "Strong Uptrend";
    if (price < ema20 && ema20 < ema50 && ema50 < ema200) return "Strong Downtrend";
  }
  if (ema50 !== undefined && ema200 !== undefined) {
    if (price > ema50 && ema50 > ema200) return "Uptrend";
    if (price < ema50 && ema50 < ema200) return "Downtrend";
  }
  if (ema50 !== undefined) {
    if (price > ema50) return "Uptrend";
    if (price < ema50) return "Downtrend";
  }
  return "Sideways";
}

export function classifyMomentum(rsiValue?: number, roc?: number): MomentumLabel {
  if (rsiValue === undefined) return "Neutral";
  if (rsiValue >= 70 && (roc ?? 0) > 0) return "Strong";
  if (rsiValue >= 55) return "Positive";
  if (rsiValue <= 30) return "Negative";
  if (rsiValue <= 45) return "Weak";
  return "Neutral";
}

export function computeIndicators(candles: Candle[]): TechnicalIndicators {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const ema20Series = ema(closes, 20);
  const ema50Series = ema(closes, 50);
  const ema200Series = ema(closes, 200);
  const rsiSeries = rsi(closes, 14);
  const atrSeries = atr(candles, 14);
  const volumeSma = sma(volumes, 20);

  const price = lastDefined(closes);
  const ema20 = lastDefined(ema20Series);
  const ema50 = lastDefined(ema50Series);
  const ema200 = lastDefined(ema200Series);
  const rsi14 = lastDefined(rsiSeries);
  const atr14 = lastDefined(atrSeries);
  const averageVolume = lastDefined(volumeSma);
  const latestVolume = lastDefined(volumes);
  const relativeVolume =
    averageVolume && averageVolume > 0 && latestVolume !== undefined
      ? latestVolume / averageVolume
      : undefined;

  const window20 = candles.slice(-20);
  const window50 = candles.slice(-50);
  const high20 = window20.length ? Math.max(...window20.map((candle) => candle.high)) : undefined;
  const high50 = window50.length ? Math.max(...window50.map((candle) => candle.high)) : undefined;
  const low20 = window20.length ? Math.min(...window20.map((candle) => candle.low)) : undefined;
  const fiftyTwoWeek = candles.slice(-252);
  const fiftyTwoWeekHigh = fiftyTwoWeek.length
    ? Math.max(...fiftyTwoWeek.map((candle) => candle.high))
    : undefined;
  const fiftyTwoWeekLow = fiftyTwoWeek.length
    ? Math.min(...fiftyTwoWeek.map((candle) => candle.low))
    : undefined;

  const swings = findSwingPoints(candles.slice(-180), 5);
  const clusterThreshold = atr14 ? atr14 * 0.6 : (price ?? 0) * 0.015;
  const supportLevels = clusterLevels(
    swings.lows.filter((level) => price === undefined || level <= price * 1.005),
    clusterThreshold,
  ).slice(-4);
  const resistanceLevels = clusterLevels(
    swings.highs.filter((level) => price === undefined || level >= price * 0.995),
    clusterThreshold,
  ).slice(0, 4);

  let roc: number | undefined;
  if (closes.length >= 11) {
    const prev = closes[closes.length - 11];
    if (prev) roc = ((closes[closes.length - 1] - prev) / prev) * 100;
  }

  let ema200SlopeAnnual: number | undefined;
  if (ema200Series.length >= 252) {
    const older = ema200Series[ema200Series.length - 252];
    const newer = lastDefined(ema200Series);
    if (older && newer) ema200SlopeAnnual = (newer - older) / older;
  }

  return {
    ema20,
    ema50,
    ema200,
    rsi14,
    atr14,
    atrPercent: atr14 && price ? (atr14 / price) * 100 : undefined,
    averageVolume,
    relativeVolume,
    swingHighs: uniqueSorted(swings.highs.slice(-8), true),
    swingLows: uniqueSorted(swings.lows.slice(-8)),
    support: uniqueSorted(supportLevels, true).slice(0, 3),
    resistance: uniqueSorted(resistanceLevels).slice(0, 3),
    high20,
    high50,
    low20,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    trend: price === undefined ? "Sideways" : classifyTrend(price, ema20, ema50, ema200),
    momentum: classifyMomentum(rsi14, roc),
    ema200SlopeAnnual,
    patterns: detectCandlePatterns(candles),
  };
}

export function periodHigh(values: number[]): number | undefined {
  return values.length ? Math.max(...values) : undefined;
}

export function periodLow(values: number[]): number | undefined {
  return values.length ? Math.min(...values) : undefined;
}
