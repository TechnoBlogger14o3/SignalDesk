import type {
  Fundamentals,
  PriceTarget,
  TargetConfidence,
  TechnicalIndicators,
} from "@/lib/market-data/types";
import {
  addCalendarMonths,
  formatMonthYear,
  formatYearRange,
} from "@/lib/market-hours";

function roundRupee(value: number): number {
  if (value >= 1000) return Math.round(value);
  if (value >= 100) return Math.round(value * 10) / 10;
  return Math.round(value * 100) / 100;
}

function nextResistance(price: number, indicators: TechnicalIndicators): number | undefined {
  const candidates = [
    ...indicators.resistance,
    indicators.high20,
    indicators.high50,
    indicators.fiftyTwoWeekHigh,
  ].filter((value): value is number => value !== undefined && value > price * 1.008);
  candidates.sort((a, b) => a - b);
  return candidates[0];
}

function followingResistance(price: number, first: number, indicators: TechnicalIndicators): number | undefined {
  const candidates = [
    ...indicators.resistance,
    indicators.high50,
    indicators.fiftyTwoWeekHigh,
    ...indicators.swingHighs,
  ].filter((value): value is number => value !== undefined && value > first * 1.01 && value > price);
  candidates.sort((a, b) => a - b);
  return candidates[0];
}

export function estimateHorizon(
  distance: number,
  atr: number,
  kind: "t1" | "t2" | "lt",
  now = new Date(),
): string {
  if (kind === "lt") {
    const start = addCalendarMonths(now, 36);
    const end = addCalendarMonths(now, 60);
    return formatYearRange(start, end);
  }
  const dailyPace = Math.max(atr * 0.35, atr * 0.2);
  const rawDays = distance / dailyPace;
  const tradingDays =
    kind === "t1" ? Math.min(90, Math.max(12, rawDays)) : Math.min(180, Math.max(40, rawDays * 2.2));
  const calendarDays = tradingDays * 1.45;
  const estimated = new Date(now.getTime() + calendarDays * 24 * 60 * 60 * 1000);
  const minDate = addCalendarMonths(now, kind === "t1" ? 1 : 3);
  return formatMonthYear(estimated > minDate ? estimated : minDate);
}

export function buildTargets(
  price: number,
  indicators: TechnicalIndicators,
  fundamentals: Fundamentals | null,
  now = new Date(),
): { t1: PriceTarget; t2: PriceTarget; longTerm: PriceTarget } {
  const atr = indicators.atr14 ?? price * 0.02;
  const r1 = nextResistance(price, indicators);
  const t1Price = r1 ?? price + 1.5 * atr;
  const t1Confidence: TargetConfidence = r1 ? "High" : "Medium";
  const t1Basis = r1
    ? "Nearest technical resistance / recent swing structure"
    : "ATR-based near-term extension while no nearby resistance is available";

  const r2 = followingResistance(price, t1Price, indicators);
  const t2Price = r2 ?? t1Price + 1.6 * atr;
  const t2Confidence: TargetConfidence = r2 ? "Medium" : "Medium";
  const t2Basis = r2
    ? "Next higher resistance and medium-term price structure"
    : "Measured medium-term extension from Target 1 using ATR and trend";

  let longTerm = buildLongTermTarget(price, indicators, fundamentals, atr, now);
  if (longTerm.price < t2Price) {
    const technicalFloor = roundRupee(t2Price * 1.12);
    longTerm = {
      ...longTerm,
      price: Math.max(technicalFloor, t2Price),
      basis: `${longTerm.basis}. The displayed level is floored by medium-term technical structure so the long-term scenario stays above Target 2.`,
    };
  }

  return {
    t1: {
      price: roundRupee(t1Price),
      confidence: t1Confidence,
      estimatedTimeframe: estimateHorizon(Math.max(t1Price - price, atr), atr, "t1", now),
      basis: t1Basis,
    },
    t2: {
      price: roundRupee(t2Price),
      confidence: t2Confidence,
      estimatedTimeframe: estimateHorizon(Math.max(t2Price - price, atr * 2), atr, "t2", now),
      basis: t2Basis,
    },
    longTerm,
  };
}

export function buildLongTermTarget(
  price: number,
  indicators: TechnicalIndicators,
  fundamentals: Fundamentals | null,
  atr: number,
  now = new Date(),
): PriceTarget {
  const years = 4;
  const growthCandidates = [
    fundamentals?.earningsGrowth,
    fundamentals?.revenueGrowth,
    indicators.ema200SlopeAnnual,
  ].filter((value): value is number => value !== undefined && Number.isFinite(value));

  let projected = price;
  let basis = "Long-term technical scenario from the 200-day trend";
  let usedGrowth: number | undefined;

  if (growthCandidates.length > 0) {
    usedGrowth = median(growthCandidates);
    usedGrowth = Math.max(-0.05, Math.min(0.28, usedGrowth));
    projected = price * (1 + usedGrowth) ** years;
    if (fundamentals?.earningsGrowth !== undefined || fundamentals?.revenueGrowth !== undefined) {
      basis = "Scenario based on reported growth rates and long-term trend, not a guaranteed outcome";
    } else {
      basis = "Scenario projected from the slope of the 200-day average";
    }
  } else if (indicators.fiftyTwoWeekHigh) {
    projected = Math.max(indicators.fiftyTwoWeekHigh * 1.15, price + 8 * atr);
    basis = "Technical scenario using the 52-week range and trend structure";
  } else {
    projected = price + 8 * atr;
    basis = "Conservative technical scenario using ATR because long-term fundamentals were unavailable";
  }

  if (fundamentals?.forwardPE && fundamentals.trailingPE && fundamentals.forwardPE > 0) {
    const peCompression = fundamentals.trailingPE / fundamentals.forwardPE;
    if (peCompression > 1 && peCompression < 1.4) {
      projected *= Math.min(peCompression, 1.15);
    }
  }

  if (indicators.trend.includes("Down")) {
    projected = Math.min(projected, price * 1.25);
  }

  projected = Math.max(projected, price * 1.05);

  return {
    price: roundRupee(projected),
    confidence: "Scenario",
    estimatedTimeframe: estimateHorizon(projected - price, atr, "lt", now),
    basis,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
