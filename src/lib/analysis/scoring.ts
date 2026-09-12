import type { ComponentScores, Fundamentals, TechnicalIndicators } from "@/lib/market-data/types";
import { clampScore } from "@/lib/analysis/weights";

export function scoreTrend(price: number, indicators: TechnicalIndicators): number {
  let score = 40;
  const { ema20, ema50, ema200, trend } = indicators;
  if (ema200 !== undefined) score += price > ema200 ? 18 : -18;
  if (ema50 !== undefined) score += price > ema50 ? 14 : -12;
  if (ema20 !== undefined) score += price > ema20 ? 10 : -8;
  if (ema20 !== undefined && ema50 !== undefined) score += ema20 > ema50 ? 12 : -10;
  if (ema50 !== undefined && ema200 !== undefined) score += ema50 > ema200 ? 12 : -10;
  if (trend === "Strong Uptrend") score += 8;
  if (trend === "Strong Downtrend") score -= 8;
  return clampScore(score);
}

export function scoreMomentum(indicators: TechnicalIndicators): number {
  const rsiValue = indicators.rsi14;
  if (rsiValue === undefined) return 50;
  if (rsiValue >= 45 && rsiValue <= 65) return 88;
  if (rsiValue > 65 && rsiValue <= 72) return 72;
  if (rsiValue > 72) return 52;
  if (rsiValue >= 35 && rsiValue < 45) return 58;
  if (rsiValue >= 30) return 42;
  return 28;
}

export function scoreVolume(indicators: TechnicalIndicators): number {
  const rel = indicators.relativeVolume;
  if (rel === undefined) return 50;
  if (rel >= 1.8) return 92;
  if (rel >= 1.3) return 78;
  if (rel >= 0.9) return 62;
  if (rel >= 0.6) return 45;
  return 30;
}

export function scoreBreakout(price: number, indicators: TechnicalIndicators): number {
  const { high20, high50, atr14 } = indicators;
  if (!high20) return 45;
  const buffer = atr14 ?? price * 0.015;
  const distance20 = (high20 - price) / buffer;
  if (high50 && price >= high50 * 0.997) return 96;
  if (price >= high20 * 0.997) return 88;
  if (distance20 <= 1) return 74;
  if (distance20 <= 2.5) return 58;
  return 36;
}

export function scoreStructure(price: number, indicators: TechnicalIndicators): number {
  const support = indicators.support[0];
  const resistance = indicators.resistance[0];
  const atr14 = indicators.atr14 ?? price * 0.02;
  let score = 50;
  if (support) {
    const dist = (price - support) / atr14;
    if (dist >= 0 && dist <= 1.2) score += 28;
    else if (dist > 1.2 && dist <= 3) score += 12;
    else if (dist < 0) score -= 25;
  }
  if (resistance) {
    const dist = (resistance - price) / atr14;
    if (dist >= 1.2) score += 16;
    else if (dist >= 0 && dist < 0.5) score -= 8;
    else if (dist < 0) score += 10;
  }
  return clampScore(score);
}

export function technicalComponentScores(price: number, indicators: TechnicalIndicators): ComponentScores {
  return {
    trend: scoreTrend(price, indicators),
    momentum: scoreMomentum(indicators),
    volume: scoreVolume(indicators),
    breakout: scoreBreakout(price, indicators),
    structure: scoreStructure(price, indicators),
  };
}

function scoreGrowth(value?: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  if (value >= 0.25) return 90;
  if (value >= 0.15) return 78;
  if (value >= 0.08) return 66;
  if (value >= 0) return 52;
  if (value >= -0.1) return 35;
  return 20;
}

function scoreMargin(value?: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  if (value >= 0.25) return 90;
  if (value >= 0.15) return 78;
  if (value >= 0.08) return 64;
  if (value >= 0.03) return 48;
  return 28;
}

function scoreRoe(value?: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  if (value >= 0.2) return 90;
  if (value >= 0.14) return 78;
  if (value >= 0.1) return 64;
  if (value >= 0.05) return 48;
  return 28;
}

function scoreLeverage(debtToEquity?: number): number | undefined {
  if (debtToEquity === undefined || !Number.isFinite(debtToEquity)) return undefined;
  if (debtToEquity <= 30) return 88;
  if (debtToEquity <= 80) return 72;
  if (debtToEquity <= 150) return 55;
  if (debtToEquity <= 250) return 38;
  return 22;
}

function scoreValuation(trailingPE?: number, forwardPE?: number): number | undefined {
  const pe = forwardPE ?? trailingPE;
  if (pe === undefined || !Number.isFinite(pe) || pe <= 0) return undefined;
  if (pe <= 18) return 82;
  if (pe <= 28) return 68;
  if (pe <= 40) return 52;
  if (pe <= 55) return 38;
  return 24;
}

export function scoreFundamentals(fundamentals: Fundamentals | null): number | null {
  if (!fundamentals) return null;
  const parts = [
    scoreGrowth(fundamentals.revenueGrowth),
    scoreGrowth(fundamentals.earningsGrowth),
    scoreMargin(fundamentals.operatingMargins ?? fundamentals.profitMargins),
    scoreRoe(fundamentals.returnOnEquity),
    scoreLeverage(fundamentals.debtToEquity),
    scoreValuation(fundamentals.trailingPE, fundamentals.forwardPE),
  ].filter((value): value is number => value !== undefined);
  if (parts.length < 3) return null;
  const average = parts.reduce((sum, value) => sum + value, 0) / parts.length;
  return clampScore(average);
}

export function overallScore(technical: number | null, fundamental: number | null): number | null {
  if (technical === null && fundamental === null) return null;
  if (technical === null) return fundamental;
  if (fundamental === null) return technical;
  return clampScore(technical * 0.6 + fundamental * 0.4);
}
