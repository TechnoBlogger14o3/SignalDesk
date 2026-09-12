import Link from "next/link";
import type { Snapshot } from "@/lib/market-data/types";
import { formatInr, formatPercent } from "@/lib/format";
import { RiskBadge, SignalBadge } from "@/components/Badges";

export function StockCard({ snapshot }: { snapshot: Snapshot }) {
  const { quote, analysis } = snapshot;
  const up = quote.changePercent >= 0;
  const t1 = analysis?.targets.t1;
  const t2 = analysis?.targets.t2;
  const lt = analysis?.targets.longTerm;

  return (
    <Link href={`/stock/${snapshot.symbol}`} className="stock-card">
      <div className="card-top">
        <div>
          <h3>{snapshot.name}</h3>
          <p className="symbol">{snapshot.symbol} · NSE</p>
        </div>
        {analysis ? <SignalBadge signal={analysis.entry.signal} /> : <span className="signal-badge signal-wait">—</span>}
      </div>

      <div className="card-price">
        <div>
          <span className="label">Current Price</span>
          <strong>{formatInr(quote.price)}</strong>
        </div>
        <span className={up ? "chg up" : "chg down"}>{formatPercent(quote.changePercent)}</span>
      </div>

      <div className="card-targets">
        <div>
          <span className="label">Target 1</span>
          <strong>{formatInr(t1?.price)}</strong>
          <em>Est. {t1?.estimatedTimeframe ?? "—"}</em>
        </div>
        <div>
          <span className="label">Target 2</span>
          <strong>{formatInr(t2?.price)}</strong>
          <em>Est. {t2?.estimatedTimeframe ?? "—"}</em>
        </div>
        <div>
          <span className="label">Long-term</span>
          <strong>{formatInr(lt?.price)}</strong>
          <em>Est. {lt?.estimatedTimeframe ?? "—"}</em>
        </div>
      </div>

      <div className="card-meta">
        <span>
          Risk {analysis ? <RiskBadge risk={analysis.entry.risk} /> : "—"}
        </span>
        {analysis?.entry.patterns?.[0] ? (
          <span className="pattern-mini">{analysis.entry.patterns[0].name}</span>
        ) : null}
        {quote.stale || quote.error ? <span className="stale">Cached</span> : null}
      </div>
    </Link>
  );
}

export function StockCardSkeleton() {
  return <div className="stock-card skeleton" aria-hidden="true" />;
}
