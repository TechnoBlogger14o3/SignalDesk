import type { ScoreWeights } from "@/lib/market-data/types";

export const DEFAULT_WEIGHTS: ScoreWeights = {
  trend: 0.35,
  momentum: 0.2,
  volume: 0.15,
  breakout: 0.15,
  structure: 0.15,
};

function envWeight(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function getScoreWeights(): ScoreWeights {
  const weights: ScoreWeights = {
    trend: envWeight("TECH_WEIGHT_TREND", DEFAULT_WEIGHTS.trend),
    momentum: envWeight("TECH_WEIGHT_MOMENTUM", DEFAULT_WEIGHTS.momentum),
    volume: envWeight("TECH_WEIGHT_VOLUME", DEFAULT_WEIGHTS.volume),
    breakout: envWeight("TECH_WEIGHT_BREAKOUT", DEFAULT_WEIGHTS.breakout),
    structure: envWeight("TECH_WEIGHT_STRUCTURE", DEFAULT_WEIGHTS.structure),
  };
  const total = weights.trend + weights.momentum + weights.volume + weights.breakout + weights.structure;
  if (total <= 0) return DEFAULT_WEIGHTS;
  if (Math.abs(total - 1) < 0.02) return weights;
  return {
    trend: weights.trend / total,
    momentum: weights.momentum / total,
    volume: weights.volume / total,
    breakout: weights.breakout / total,
    structure: weights.structure / total,
  };
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function weightedScore(
  components: { trend: number; momentum: number; volume: number; breakout: number; structure: number },
  weights: ScoreWeights,
): number {
  return clampScore(
    components.trend * weights.trend * 100 +
      components.momentum * weights.momentum * 100 +
      components.volume * weights.volume * 100 +
      components.breakout * weights.breakout * 100 +
      components.structure * weights.structure * 100,
  );
}
