import type { Candle, CandleBias, CandlePattern, CandlePatternName } from "@/lib/market-data/types";

export type { CandlePattern, CandlePatternName, CandleBias };

interface Geometry {
  body: number;
  range: number;
  upper: number;
  lower: number;
  mid: number;
  bullish: boolean;
  bearish: boolean;
}

function geometry(candle: Candle): Geometry {
  const body = Math.abs(candle.close - candle.open);
  const range = Math.max(candle.high - candle.low, 0);
  const upper = candle.high - Math.max(candle.open, candle.close);
  const lower = Math.min(candle.open, candle.close) - candle.low;
  return {
    body,
    range,
    upper,
    lower,
    mid: (candle.high + candle.low) / 2,
    bullish: candle.close > candle.open,
    bearish: candle.close < candle.open,
  };
}

function priorDirection(candles: Candle[], index: number, lookback = 3): "up" | "down" | "flat" {
  const from = index - lookback;
  if (from < 0) return "flat";
  const change = candles[index - 1].close - candles[from].close;
  const avg = Math.abs(candles[index - 1].close);
  if (avg === 0) return "flat";
  if (change / avg <= -0.012) return "down";
  if (change / avg >= 0.012) return "up";
  return "flat";
}

function isDoji(shape: Geometry): boolean {
  return shape.range > 0 && shape.body / shape.range <= 0.1;
}

function isHammerShape(shape: Geometry): boolean {
  if (shape.range <= 0) return false;
  const body = Math.max(shape.body, shape.range * 0.02);
  return (
    shape.lower >= 2 * body &&
    shape.upper <= Math.max(0.5 * body, 0.12 * shape.range) &&
    body / shape.range <= 0.4
  );
}

function isStarShape(shape: Geometry): boolean {
  if (shape.range <= 0) return false;
  const body = Math.max(shape.body, shape.range * 0.02);
  return (
    shape.upper >= 2 * body &&
    shape.lower <= Math.max(0.5 * body, 0.12 * shape.range) &&
    body / shape.range <= 0.4
  );
}

function push(
  out: CandlePattern[],
  candles: Candle[],
  index: number,
  name: CandlePatternName,
  bias: CandleBias,
  bars: 1 | 2 | 3,
  reliability: CandlePattern["reliability"],
) {
  out.push({
    name,
    bias,
    bars,
    index,
    date: candles[index].date,
    barsAgo: candles.length - 1 - index,
    reliability,
  });
}

export function detectCandlePatterns(candles: Candle[]): CandlePattern[] {
  const found: CandlePattern[] = [];
  if (candles.length === 0) return found;

  for (let i = 0; i < candles.length; i += 1) {
    const current = candles[i];
    const shape = geometry(current);
    const prior = priorDirection(candles, i);
    const recentEnough = i >= candles.length - 8;

    if (!recentEnough) continue;
    if (shape.range === 0) continue;

    if (isHammerShape(shape)) {
      if (prior === "up") push(found, candles, i, "Hanging Man", "Bearish", 1, "Medium");
      else push(found, candles, i, "Hammer", "Bullish", 1, prior === "down" ? "High" : "Medium");
    } else if (isStarShape(shape)) {
      if (prior === "down") push(found, candles, i, "Inverted Hammer", "Bullish", 1, "Medium");
      else push(found, candles, i, "Shooting Star", "Bearish", 1, prior === "up" ? "High" : "Medium");
    } else if (isDoji(shape)) {
      if (shape.lower >= 2 * Math.max(shape.body, shape.range * 0.2) && shape.upper <= shape.range * 0.15) {
        push(found, candles, i, "Dragonfly Doji", prior === "down" ? "Bullish" : "Neutral", 1, "Medium");
      } else if (shape.upper >= 2 * Math.max(shape.body, shape.range * 0.2) && shape.lower <= shape.range * 0.15) {
        push(found, candles, i, "Gravestone Doji", prior === "up" ? "Bearish" : "Neutral", 1, "Medium");
      } else {
        push(found, candles, i, "Doji", "Neutral", 1, "Low");
      }
    }

    if (i < 1) continue;
    const prev = candles[i - 1];
    const prevShape = geometry(prev);

    const bullishEngulfing =
      prevShape.bearish &&
      shape.bullish &&
      current.open <= prev.close &&
      current.close >= prev.open &&
      shape.body > prevShape.body;

    const bearishEngulfing =
      prevShape.bullish &&
      shape.bearish &&
      current.open >= prev.close &&
      current.close <= prev.open &&
      shape.body > prevShape.body;

    if (bullishEngulfing) push(found, candles, i, "Bullish Engulfing", "Bullish", 2, "High");
    if (bearishEngulfing) push(found, candles, i, "Bearish Engulfing", "Bearish", 2, "High");

    const bullishHarami =
      prevShape.bullish === false &&
      prevShape.body > 0 &&
      shape.bullish &&
      shape.body < prevShape.body &&
      current.open >= prev.close &&
      current.close <= prev.open;
    const bearishHarami =
      prevShape.bearish === false &&
      prevShape.body > 0 &&
      shape.bearish &&
      shape.body < prevShape.body &&
      current.open <= prev.close &&
      current.close >= prev.open;
    if (bullishHarami) push(found, candles, i, "Bullish Harami", "Bullish", 2, "Low");
    if (bearishHarami) push(found, candles, i, "Bearish Harami", "Bearish", 2, "Low");

    const midpointPrev = (prev.open + prev.close) / 2;
    if (
      prevShape.bearish &&
      shape.bullish &&
      current.open < prev.close &&
      current.close > midpointPrev &&
      current.close < prev.open &&
      !bullishEngulfing
    ) {
      push(found, candles, i, "Piercing Line", "Bullish", 2, "Medium");
    }
    if (
      prevShape.bullish &&
      shape.bearish &&
      current.open > prev.close &&
      current.close < midpointPrev &&
      current.close > prev.open &&
      !bearishEngulfing
    ) {
      push(found, candles, i, "Dark Cloud Cover", "Bearish", 2, "Medium");
    }

    if (i < 2) continue;
    const first = candles[i - 2];
    const firstShape = geometry(first);
    const middle = candles[i - 1];
    const middleShape = geometry(middle);

    const morningStar =
      firstShape.bearish &&
      firstShape.body / Math.max(firstShape.range, 1) >= 0.45 &&
      middleShape.body < firstShape.body * 0.55 &&
      shape.bullish &&
      current.close >= (first.open + first.close) / 2;

    const eveningStar =
      firstShape.bullish &&
      firstShape.body / Math.max(firstShape.range, 1) >= 0.45 &&
      middleShape.body < firstShape.body * 0.55 &&
      shape.bearish &&
      current.close <= (first.open + first.close) / 2;

    if (morningStar) push(found, candles, i, "Morning Star", "Bullish", 3, "High");
    if (eveningStar) push(found, candles, i, "Evening Star", "Bearish", 3, "High");
  }

  return found.sort((a, b) => a.barsAgo - b.barsAgo);
}

export const BULLISH_REVERSALS: CandlePatternName[] = [
  "Hammer",
  "Inverted Hammer",
  "Dragonfly Doji",
  "Bullish Engulfing",
  "Bullish Harami",
  "Piercing Line",
  "Morning Star",
];

export const BEARISH_REVERSALS: CandlePatternName[] = [
  "Hanging Man",
  "Shooting Star",
  "Gravestone Doji",
  "Bearish Engulfing",
  "Bearish Harami",
  "Dark Cloud Cover",
  "Evening Star",
];

export function recentPatterns(patterns: CandlePattern[], maxBarsAgo = 2): CandlePattern[] {
  return patterns.filter((pattern) => pattern.barsAgo <= maxBarsAgo);
}

export function hasBias(patterns: CandlePattern[], bias: CandleBias, names: CandlePatternName[]): boolean {
  return recentPatterns(patterns).some(
    (pattern) => pattern.bias === bias && names.includes(pattern.name),
  );
}
