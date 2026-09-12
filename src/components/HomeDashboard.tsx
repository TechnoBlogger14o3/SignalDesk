"use client";

import useSWR from "swr";
import { Header } from "@/components/Header";
import { StockCard, StockCardSkeleton } from "@/components/StockCard";
import { ErrorPanel } from "@/components/ErrorPanel";
import { formatIstTimestamp } from "@/lib/market-hours";
import type { Snapshot } from "@/lib/market-data/types";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Market data temporarily unavailable.");
  return data;
};

export function HomeDashboard() {
  const watchlist = useWatchlist();
  const { data: market } = useSWR("/api/market-status", fetcher, { refreshInterval: 60_000 });
  const symbolsKey = watchlist.symbols.join(",");
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<{ stocks: Snapshot[] }>(
    symbolsKey ? `/api/watchlist?symbols=${encodeURIComponent(symbolsKey)}` : null,
    fetcher,
    {
      refreshInterval: market?.shouldAutoRefresh ? 5 * 60 * 1000 : 0,
      revalidateOnFocus: false,
    },
  );

  const stocks = data?.stocks ?? [];
  const staleStock = stocks.find((stock) => stock.quote.stale || stock.quote.error);
  const lastUpdated = stocks
    .map((stock) => stock.quote.lastSuccessfulUpdate)
    .filter(Boolean)
    .sort()
    .at(-1);

  async function refresh() {
    if (!symbolsKey) return;
    await mutate(
      async () => {
        const response = await fetch(`/api/watchlist?symbols=${encodeURIComponent(symbolsKey)}&refresh=1`);
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
            Search to add names, including ETFs. The list stays in this browser. Targets are
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

        {watchlist.symbols.length === 0 ? (
          <p className="lede">Your watchlist is empty. Type a name in search and click Add.</p>
        ) : error && stocks.length === 0 ? (
          <ErrorPanel onRetry={refresh} />
        ) : (
          <div className="card-grid">
            {isLoading
              ? watchlist.symbols.map((symbol) => <StockCardSkeleton key={symbol} />)
              : stocks.map((snapshot) => (
                  <StockCard
                    key={snapshot.symbol}
                    snapshot={snapshot}
                    onRemove={() => watchlist.remove(snapshot.symbol)}
                  />
                ))}
          </div>
        )}
      </main>
    </>
  );
}
