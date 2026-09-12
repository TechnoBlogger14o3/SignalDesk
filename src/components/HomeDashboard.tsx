"use client";

import useSWR from "swr";
import { Header } from "@/components/Header";
import { StockCard, StockCardSkeleton } from "@/components/StockCard";
import { ErrorPanel } from "@/components/ErrorPanel";
import { formatIstTimestamp } from "@/lib/market-hours";
import type { Snapshot } from "@/lib/market-data/types";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Market data temporarily unavailable.");
  return data;
};

export function HomeDashboard() {
  const { data: market } = useSWR("/api/market-status", fetcher, { refreshInterval: 60_000 });
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<{ stocks: Snapshot[] }>("/api/watchlist", fetcher, {
    refreshInterval: market?.shouldAutoRefresh ? 5 * 60 * 1000 : 0,
    revalidateOnFocus: false,
  });

  const stocks = data?.stocks ?? [];
  const staleStock = stocks.find((stock) => stock.quote.stale || stock.quote.error);
  const lastUpdated = stocks
    .map((stock) => stock.quote.lastSuccessfulUpdate)
    .filter(Boolean)
    .sort()
    .at(-1);

  async function refresh() {
    await mutate(
      async () => {
        const response = await fetch("/api/watchlist?refresh=1");
        return response.json();
      },
      { revalidate: false },
    );
  }

  return (
    <>
      <Header
        status={market?.status}
        statusLabel={market?.label}
        lastUpdated={lastUpdated ? formatIstTimestamp(lastUpdated) : market?.serverTime}
        onRefresh={refresh}
        refreshing={isValidating}
      />
      <main className="page">
        <section className="hero">
          <p className="eyebrow">Watchlist</p>
          <h1>Important Stocks</h1>
          <p className="lede">
            Current price, near-term targets, and entry guidance from live market data. Targets are
            analytical scenarios, not guaranteed predictions.
          </p>
        </section>

        {staleStock ? (
          <ErrorPanel
            lastPrice={staleStock.quote.price}
            lastUpdate={staleStock.quote.lastSuccessfulUpdate}
            onRetry={refresh}
          />
        ) : null}

        {error && stocks.length === 0 ? (
          <ErrorPanel onRetry={refresh} />
        ) : (
          <div className="card-grid">
            {isLoading
              ? Array.from({ length: 10 }).map((_, index) => <StockCardSkeleton key={index} />)
              : stocks.map((snapshot) => <StockCard key={snapshot.symbol} snapshot={snapshot} />)}
          </div>
        )}
      </main>
    </>
  );
}
