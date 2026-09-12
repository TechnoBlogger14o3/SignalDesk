import type { EntrySignal, MarketSession, RiskLevel } from "@/lib/market-data/types";

const SIGNAL_CLASS: Record<EntrySignal, string> = {
  "ENTRY NOW": "signal-buy",
  "BUY ON DIP": "signal-accumulate",
  ACCUMULATE: "signal-accumulate",
  HOLD: "signal-hold",
  WAIT: "signal-wait",
  REDUCE: "signal-reduce",
  EXIT: "signal-exit",
};

export function SignalBadge({ signal }: { signal: EntrySignal | string }) {
  const cls = SIGNAL_CLASS[signal as EntrySignal] ?? "signal-wait";
  return <span className={`signal-badge ${cls}`}>{signal}</span>;
}

export function RiskBadge({ risk }: { risk: RiskLevel | string }) {
  const cls = risk === "Low" ? "risk-low" : risk === "High" ? "risk-high" : "risk-medium";
  return <span className={`risk-badge ${cls}`}>{risk}</span>;
}

export function MarketBadge({ status, label }: { status: MarketSession | string; label?: string }) {
  const live = status === "OPEN";
  return (
    <span className={`market-badge ${live ? "market-open" : "market-closed"}`}>
      <span className="market-dot" />
      {label ?? (live ? "Market Open" : status === "CLOSED" ? "Market Closed" : String(status))}
    </span>
  );
}
