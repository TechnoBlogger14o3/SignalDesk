import type {
  AnalysisResult,
  Candle,
  Fundamentals,
  Quote,
} from "@/lib/market-data/types";
import { computeIndicators } from "@/lib/analysis/indicators";
import { overallScore, scoreFundamentals, technicalComponentScores } from "@/lib/analysis/scoring";
import { getScoreWeights, weightedScore } from "@/lib/analysis/weights";
import { buildEntryPlan } from "@/lib/analysis/entry";
import { buildTargets } from "@/lib/analysis/targets";

function inr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function analyzeSnapshot(
  quote: Quote,
  candles: Candle[],
  fundamentals: Fundamentals | null,
  now = new Date(),
): AnalysisResult | null {
  if (candles.length < 30) return null;

  const indicators = computeIndicators(candles);
  const weights = getScoreWeights();
  const components = technicalComponentScores(quote.price, indicators);
  const technical = weightedScore(
    {
      trend: components.trend / 100,
      momentum: components.momentum / 100,
      volume: components.volume / 100,
      breakout: components.breakout / 100,
      structure: components.structure / 100,
    },
    weights,
  );
  const fundamental = scoreFundamentals(fundamentals);
  const overall = overallScore(technical, fundamental);
  const entry = buildEntryPlan(quote.price, indicators, technical, fundamental, indicators.patterns);
  const targets = buildTargets(quote.price, indicators, fundamentals, now);

  const supportText = indicators.support[0] ? inr(indicators.support[0]) : "nearby support";
  const stopText = entry.stop ? inr(entry.stop) : "the invalidation level";

  return {
    indicators,
    scores: {
      technical,
      fundamental,
      overall,
      components,
      weights,
    },
    entry,
    targets,
    scenarios: {
      bull: `If the trend holds and price clears ${inr(targets.t1.price)}, the next technical area is ${inr(targets.t2.price)}. This is a scenario, not a guarantee.`,
      base: `The constructive case is that ${quote.name} stays above ${supportText} and works toward ${inr(targets.t1.price)} over the estimated near-term window.`,
      bear: `A break below ${stopText} would weaken the setup and shift the bias toward ${entry.signal === "EXIT" ? "staying defensive" : "cutting risk"}.`,
    },
  };
}
