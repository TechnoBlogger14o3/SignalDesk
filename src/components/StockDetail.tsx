"use client";

import useSWR from "swr";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PriceChart } from "@/components/PriceChart";
import { ScoreRow } from "@/components/ScoreRow";
import { ErrorPanel } from "@/components/ErrorPanel";
import { MarketBadge, SignalBadge } from "@/components/Badges";
import { formatInr, formatNumber, formatPercent } from "@/lib/format";
import { formatIstTimestamp } from "@/lib/market-hours";
import type { ChartLevel } from "@/lib/analysis/chart";
import type { AnalysisResult, Snapshot } from "@/lib/market-data/types";

function levelsFromAnalysis(analysis: AnalysisResult | null): ChartLevel[] {
  if (!analysis) return [];
  const levels: ChartLevel[] = [];
  const support = analysis.indicators.support[0];
  const resistance = analysis.indicators.resistance[0];
  if (support) levels.push({ label: "Support", price: support, color: "#60a5fa" });
  if (resistance) levels.push({ label: "Resist", price: resistance, color: "#fbbf24" });
  if (analysis.entry.stop) levels.push({ label: "Stop", price: analysis.entry.stop, color: "#f87171" });
  levels.push({ label: "T1", price: analysis.targets.t1.price, color: "#34d399" });
  levels.push({ label: "T2", price: analysis.targets.t2.price, color: "#5eead4" });
  return levels;
}

async function jsonFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Market data temporarily unavailable.");
  return data as T;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="metric">
      <span className="label">{label}</span>
      <strong>{value}</strong>
      {hint ? <em>{hint}</em> : null}
    </div>
  );
}

export function StockDetail({ symbol }: { symbol: string }) {
  const { data: market } = useSWR("/api/market-status", jsonFetcher<{ shouldAutoRefresh?: boolean }>, {
    refreshInterval: 60_000,
  });
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `/api/snapshot/${symbol}`,
    jsonFetcher<Snapshot>,
    { refreshInterval: market?.shouldAutoRefresh ? 5 * 60 * 1000 : 0, revalidateOnFocus: false },
  );

  async function refresh() {
    await mutate(async () => jsonFetcher<Snapshot>(`/api/snapshot/${symbol}?refresh=1`), {
      revalidate: false,
    });
  }

  if (error && !data) {
    const unknown = error.message.toLowerCase().includes("unknown");
    return (
      <>
        <Header onRefresh={refresh} refreshing={isValidating} />
        <main className="page">
          {unknown ? (
            <div className="error-panel" role="status">
              <p>No matching NSE stock for “{symbol}”.</p>
              <p>Try a listed symbol such as HDFCBANK, KAYNES, RELIANCE, or TCS.</p>
              <Link href="/" className="btn">
                Back to watchlist
              </Link>
            </div>
          ) : (
            <ErrorPanel onRetry={refresh} />
          )}
        </main>
      </>
    );
  }

  if (isLoading || !data) {
    return (
      <>
        <Header />
        <main className="page">
          <div className="stock-card skeleton" style={{ minHeight: 320 }} />
        </main>
      </>
    );
  }

  const { quote, analysis } = data;
  const up = quote.changePercent >= 0;
  const closed = quote.marketStatus !== "OPEN";
  const chartLevels = levelsFromAnalysis(analysis);

  return (
    <>
      <Header
        status={quote.marketStatus}
        statusLabel={closed ? "Market Closed" : "Market Open"}
        lastUpdated={formatIstTimestamp(quote.lastSuccessfulUpdate)}
        onRefresh={refresh}
        refreshing={isValidating}
      />
      <main className="page">
        <p className="crumb">
          <Link href="/">Important Stocks</Link> / {data.symbol}
        </p>
        <section className="detail-head">
          <div>
            <h1>{data.name}</h1>
            <p className="symbol">
              {data.symbol} · NSE <MarketBadge status={quote.marketStatus} />
            </p>
          </div>
          <div className="detail-price">
            <strong>{formatInr(quote.price)}</strong>
            <span className={up ? "chg up" : "chg down"}>{formatPercent(quote.changePercent)}</span>
            {closed ? <p className="muted">Last price · not live</p> : <p className="muted">Live during market hours</p>}
          </div>
        </section>

        {quote.stale || quote.error ? (
          <ErrorPanel lastPrice={quote.price} lastUpdate={quote.lastSuccessfulUpdate} onRetry={refresh} />
        ) : null}

        {data.candles ? (
          <PriceChart
            candles={data.candles}
            patterns={analysis?.indicators.patterns}
            levels={chartLevels}
          />
        ) : null}

        {analysis ? (
          <>
            <section className="panel">
              <div className="panel-head">
                <h2>Setup</h2>
                <SignalBadge signal={analysis.entry.signal} />
              </div>
              <p className="explanation">{analysis.entry.explanation}</p>
              {analysis.entry.patterns && analysis.entry.patterns.length > 0 ? (
                <div className="pattern-row">
                  {analysis.entry.patterns.slice(0, 4).map((pattern) => (
                    <span key={`${pattern.name}-${pattern.index}`} className={`pattern-chip ${pattern.bias.toLowerCase()}`}>
                      {pattern.name}
                      <em>
                        {pattern.barsAgo === 0 ? "latest" : `${pattern.barsAgo}d ago`} · {pattern.bias}
                      </em>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="muted">No hammer / engulfing / star pattern in the last few sessions.</p>
              )}
              <div className="metric-grid">
                <Metric
                  label="Entry zone"
                  value={`${formatInr(analysis.entry.entryZone?.low)} – ${formatInr(analysis.entry.entryZone?.high)}`}
                />
                <Metric label="Stop / risk" value={formatInr(analysis.entry.stop)} />
                <Metric label="Risk" value={analysis.entry.risk} />
                <Metric label="Trend" value={analysis.indicators.trend} />
              </div>
            </section>

            <section className="panel">
              <h2>Targets</h2>
              <p className="muted">Estimated timeframe is a working window, not a promise that the level will be reached.</p>
              <div className="metric-grid targets-grid">
                <Metric
                  label="Target 1"
                  value={formatInr(analysis.targets.t1.price)}
                  hint={`Estimated timeframe · ${analysis.targets.t1.estimatedTimeframe} · Confidence: ${analysis.targets.t1.confidence}`}
                />
                <Metric
                  label="Target 2"
                  value={formatInr(analysis.targets.t2.price)}
                  hint={`Estimated timeframe · ${analysis.targets.t2.estimatedTimeframe} · Confidence: ${analysis.targets.t2.confidence}`}
                />
                <Metric
                  label="Long-term"
                  value={formatInr(analysis.targets.longTerm.price)}
                  hint={`Estimated timeframe · ${analysis.targets.longTerm.estimatedTimeframe} · Confidence: ${analysis.targets.longTerm.confidence}`}
                />
              </div>
            </section>

            <section className="panel">
              <h2>Technical levels</h2>
              <div className="metric-grid">
                <Metric label="Support" value={analysis.indicators.support.map((level) => formatInr(level)).join(" · ") || "—"} />
                <Metric label="Resistance" value={analysis.indicators.resistance.map((level) => formatInr(level)).join(" · ") || "—"} />
                <Metric label="EMA 20 / 50 / 200" value={`${formatInr(analysis.indicators.ema20)} / ${formatInr(analysis.indicators.ema50)} / ${formatInr(analysis.indicators.ema200)}`} />
                <Metric label="RSI 14" value={formatNumber(analysis.indicators.rsi14, 1)} />
                <Metric label="ATR 14" value={formatInr(analysis.indicators.atr14)} />
                <Metric label="Relative volume" value={formatNumber(analysis.indicators.relativeVolume, 2)} />
              </div>
            </section>

            <section className="panel">
              <h2>Scores</h2>
              <ScoreRow
                technical={analysis.scores.technical}
                fundamental={analysis.scores.fundamental}
                overall={analysis.scores.overall}
              />
            </section>

            <section className="panel">
              <h2>Scenarios</h2>
              <div className="cases">
                <article>
                  <h3>Bull case</h3>
                  <p>{analysis.scenarios.bull}</p>
                </article>
                <article>
                  <h3>Base case</h3>
                  <p>{analysis.scenarios.base}</p>
                </article>
                <article>
                  <h3>Bear case</h3>
                  <p>{analysis.scenarios.bear}</p>
                </article>
              </div>
            </section>
          </>
        ) : (
          <p className="muted">Not enough history to compute a full technical setup yet.</p>
        )}
      </main>
    </>
  );
}
