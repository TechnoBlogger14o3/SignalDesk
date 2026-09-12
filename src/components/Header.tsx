"use client";

import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { MarketBadge } from "@/components/Badges";

export function Header({
  status,
  statusLabel,
  lastUpdated,
  onRefresh,
  refreshing,
}: {
  status?: string;
  statusLabel?: string;
  lastUpdated?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span className="logo-mark">S</span>
          <span>
            <strong>SignalDesk</strong>
            <small>Indian market analysis</small>
          </span>
        </Link>
        <SearchBox />
        <div className="header-meta">
          <Link href="/portfolio" className="nav-link">
            Portfolio
          </Link>
          {status ? <MarketBadge status={status} label={statusLabel} /> : null}
          {lastUpdated ? <p className="updated">Last updated: {lastUpdated}</p> : null}
          {onRefresh ? (
            <button type="button" className="btn btn-ghost" onClick={onRefresh} disabled={refreshing}>
              {refreshing ? "Refreshing…" : "Refresh now"}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
