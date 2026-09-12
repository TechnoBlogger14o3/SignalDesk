export type Exchange = "NSE";

export type MarketSession = "OPEN" | "CLOSED" | "PRE-OPEN" | "POST-MARKET";

export type RiskLevel = "Low" | "Medium" | "High";

export type EntrySignal =
  | "ENTRY NOW"
  | "BUY ON DIP"
  | "ACCUMULATE"
  | "WAIT"
  | "HOLD"
  | "REDUCE"
  | "EXIT";

export type TargetConfidence = "High" | "Medium" | "Scenario";

export type TrendDirection = "Strong Uptrend" | "Uptrend" | "Sideways" | "Downtrend" | "Strong Downtrend";

export type MomentumLabel = "Strong" | "Positive" | "Neutral" | "Weak" | "Negative";

export type CandleBias = "Bullish" | "Bearish" | "Neutral";

export type CandlePatternName =
  | "Hammer"
  | "Inverted Hammer"
  | "Hanging Man"
  | "Shooting Star"
  | "Doji"
  | "Dragonfly Doji"
  | "Gravestone Doji"
  | "Bullish Engulfing"
  | "Bearish Engulfing"
  | "Bullish Harami"
  | "Bearish Harami"
  | "Piercing Line"
  | "Dark Cloud Cover"
  | "Morning Star"
  | "Evening Star";

export interface CandlePattern {
  name: CandlePatternName;
  bias: CandleBias;
  bars: 1 | 2 | 3;
  index: number;
  date: string;
  barsAgo: number;
  reliability: "High" | "Medium" | "Low";
}

export interface Quote {
  symbol: string;
  exchange: Exchange;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  previousClose?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency: "INR";
  timestamp: string;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: Exchange;
}

export interface Fundamentals {
  symbol: string;
  revenueGrowth?: number;
  earningsGrowth?: number;
  profitMargins?: number;
  operatingMargins?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  debtToEquity?: number;
  trailingPE?: number;
  forwardPE?: number;
  pegRatio?: number;
  bookValue?: number;
  priceToBook?: number;
  enterpriseToEbitda?: number;
  currentRatio?: number;
  targetMeanPrice?: number;
  recommendationKey?: string;
  sector?: string;
  industry?: string;
}

export interface HistoryOptions {
  range?: "1y" | "2y" | "5y" | "10y";
  interval?: "1d" | "1wk";
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getHistory(symbol: string, options?: HistoryOptions): Promise<Candle[]>;
  search(query: string): Promise<SearchResult[]>;
  getFundamentals(symbol: string): Promise<Fundamentals | null>;
}

export interface ScoreWeights {
  trend: number;
  momentum: number;
  volume: number;
  breakout: number;
  structure: number;
}

export interface TechnicalIndicators {
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  atr14?: number;
  atrPercent?: number;
  averageVolume?: number;
  relativeVolume?: number;
  swingHighs: number[];
  swingLows: number[];
  support: number[];
  resistance: number[];
  high20?: number;
  high50?: number;
  low20?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  trend: TrendDirection;
  momentum: MomentumLabel;
  ema200SlopeAnnual?: number;
  patterns: CandlePattern[];
}

export interface ComponentScores {
  trend: number;
  momentum: number;
  volume: number;
  breakout: number;
  structure: number;
}

export interface Scores {
  technical: number | null;
  fundamental: number | null;
  overall: number | null;
  components: ComponentScores;
  weights: ScoreWeights;
}

export interface PriceTarget {
  price: number;
  confidence: TargetConfidence;
  estimatedTimeframe: string;
  basis: string;
}

export interface EntryPlan {
  signal: EntrySignal;
  explanation: string;
  entryZone?: { low: number; high: number };
  stop?: number;
  risk: RiskLevel;
  patterns?: CandlePattern[];
}

export interface ScenarioSet {
  bull: string;
  base: string;
  bear: string;
}

export interface AnalysisResult {
  indicators: TechnicalIndicators;
  scores: Scores;
  entry: EntryPlan;
  targets: {
    t1: PriceTarget;
    t2: PriceTarget;
    longTerm: PriceTarget;
  };
  scenarios: ScenarioSet;
}

export interface QuoteResponse extends Quote {
  marketStatus: MarketSession;
  isLive: boolean;
  stale: boolean;
  lastSuccessfulUpdate: string;
  error?: string;
}

export interface Snapshot {
  symbol: string;
  name: string;
  exchange: Exchange;
  quote: QuoteResponse;
  analysis: AnalysisResult | null;
  candles?: Candle[];
}
