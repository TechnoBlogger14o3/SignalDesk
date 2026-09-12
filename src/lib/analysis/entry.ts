import type { EntryPlan, EntrySignal, RiskLevel, TechnicalIndicators } from "@/lib/market-data/types";
import {
  BEARISH_REVERSALS,
  BULLISH_REVERSALS,
  recentPatterns,
  type CandlePattern,
} from "@/lib/analysis/candles";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function assessRisk(indicators: TechnicalIndicators, technicalScore: number | null): RiskLevel {
  const atrPct = indicators.atrPercent ?? 0;
  if (atrPct >= 4 || (technicalScore !== null && technicalScore < 40)) return "High";
  if (atrPct >= 2.2 || (technicalScore !== null && technicalScore < 55)) return "Medium";
  if (indicators.trend.includes("Down")) return "Medium";
  return "Low";
}

function latestReversal(patterns: CandlePattern[]): CandlePattern | undefined {
  return recentPatterns(patterns).find(
    (pattern) =>
      BULLISH_REVERSALS.includes(pattern.name) || BEARISH_REVERSALS.includes(pattern.name),
  );
}

function withPattern(text: string, pattern?: CandlePattern): string {
  if (!pattern) return text;
  return `${text} Latest candle: ${pattern.name}.`;
}

export function buildEntryPlan(
  price: number,
  indicators: TechnicalIndicators,
  technicalScore: number | null,
  fundamentalScore: number | null = null,
  patterns: CandlePattern[] = [],
): EntryPlan {
  const atr = indicators.atr14 ?? price * 0.02;
  const support = indicators.support[0];
  const { ema20, ema50, ema200, rsi14, trend } = indicators;
  const extended =
    (rsi14 !== undefined && rsi14 >= 68) ||
    (ema20 !== undefined && price > ema20 + 1.6 * atr);
  const nearSupport = support !== undefined && Math.abs(price - support) <= 1.1 * atr;
  const nearEma20 = ema20 !== undefined && Math.abs(price - ema20) <= 0.9 * atr;
  const longTermUp = ema200 !== undefined && price > ema200;
  const belowEma50 = ema50 !== undefined && price < ema50;
  const belowEma200 = ema200 !== undefined && price < ema200;
  const lostSupport = support !== undefined && price < support - 0.4 * atr;
  const qualityName = (fundamentalScore ?? 0) >= 60;
  const brokenDown = (belowEma200 && belowEma50 && trend.includes("Down")) || (lostSupport && belowEma50);
  const reversal = latestReversal(patterns);
  const bullishCandle = Boolean(reversal && BULLISH_REVERSALS.includes(reversal.name));
  const bearishCandle = Boolean(reversal && BEARISH_REVERSALS.includes(reversal.name));

  let signal: EntrySignal = "WAIT";
  let explanation = "The current setup is mixed, so waiting for a clearer technical structure is preferred.";

  if (brokenDown && !qualityName) {
    signal = "EXIT";
    explanation =
      "Price has lost key support and the intermediate trend has deteriorated, so risk conditions no longer support staying with the setup.";
  } else if (brokenDown && qualityName) {
    signal = "ACCUMULATE";
    explanation =
      "Near-term trend is weak, but longer-term fundamentals remain constructive. Staggered buying on further weakness is preferred over a forced exit.";
  } else if (belowEma50 && (rsi14 ?? 50) < 48 && trend.includes("Down") && !qualityName) {
    signal = "REDUCE";
    explanation =
      "The stock has slipped below the 50-day average with fading momentum. Reducing exposure is more appropriate than adding.";
  } else if (
    bearishCandle &&
    (trend === "Strong Uptrend" || trend === "Uptrend" || extended) &&
    (rsi14 === undefined || rsi14 >= 50)
  ) {
    signal = "BUY ON DIP";
    explanation = `The trend is still up, but a ${reversal?.name} warns that price is extended. Wait for a pullback instead of chasing.`;
  } else if (
    bullishCandle &&
    (trend === "Strong Uptrend" || trend === "Uptrend" || nearSupport || nearEma20) &&
    (rsi14 === undefined || rsi14 <= 68) &&
    !belowEma200
  ) {
    signal = "ENTRY NOW";
    explanation = `A ${reversal?.name} printed while the trend is still constructive, which is a favorable short-term entry cue.`;
  } else if (
    (trend === "Strong Uptrend" || trend === "Uptrend") &&
    (nearSupport || nearEma20) &&
    (rsi14 === undefined || (rsi14 >= 38 && rsi14 <= 65))
  ) {
    signal = "ENTRY NOW";
    explanation =
      "The trend is constructive and the current price is close to a favorable technical area near support or the 20-day average.";
  } else if ((trend === "Strong Uptrend" || trend === "Uptrend") && extended) {
    signal = "BUY ON DIP";
    explanation =
      "The broader trend is bullish, but price looks extended versus the short-term average or RSI. A pullback would offer a better entry.";
  } else if (longTermUp && (technicalScore ?? 0) >= 60) {
    signal = "ACCUMULATE";
    explanation =
      "The long-term trend remains favorable. Staggered buying is preferred over chasing a single entry.";
  } else if ((trend === "Strong Uptrend" || trend === "Uptrend") && !extended) {
    signal = "HOLD";
    explanation =
      "The uptrend is intact and there is no breakdown, but the stock is not at a standout fresh-entry zone.";
  } else if (longTermUp || qualityName) {
    signal = "WAIT";
    explanation =
      "The longer-term picture is still usable, but the near-term setup is not attractive enough to act on yet.";
  }

  explanation = withPattern(explanation, reversal && !explanation.includes(reversal.name) ? reversal : undefined);

  const risk = assessRisk(indicators, technicalScore);
  const stop = support ? round2(support - 0.8 * atr) : ema50 ? round2(ema50 - atr) : round2(price - 1.8 * atr);
  const zoneLow = support ? round2(Math.max(support, price - atr)) : round2(price - 0.8 * atr);
  const zoneHigh = ema20 ? round2(Math.min(price + 0.35 * atr, ema20 + 0.4 * atr)) : round2(price + 0.3 * atr);

  return {
    signal,
    explanation,
    entryZone: { low: Math.min(zoneLow, zoneHigh), high: Math.max(zoneLow, zoneHigh) },
    stop: stop > 0 ? stop : undefined,
    risk,
    patterns: recentPatterns(patterns, 5),
  };
}
