"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { formatInr, formatPercent } from "@/lib/format";
import { encodeLotsQuery } from "@/lib/portfolio/storage";
import { useHoldings } from "@/lib/portfolio/useHoldings";
import type { SearchResult } from "@/lib/market-data/types";

type HoldingRow = {
  symbol: string;
  name: string;
  shares: number;
  averagePrice: number;
  price: number | null;
  pnl: number | null;
  pnlPercent: number | null;
  value: number | null;
  error?: string;
};

export default function PortfolioPage() {
  const { holdings, upsert, remove } = useHoldings();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [shares, setShares] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const lots = encodeLotsQuery(holdings);
  const { data, isValidating } = useSWR<{ holdings: HoldingRow[] }>(
    `/api/portfolio?lots=${encodeURIComponent(lots)}`,
    (url: string) => fetch(url).then((response) => response.json()),
  );

  const rows = data?.holdings ?? [];

  function pick(result: SearchResult) {
    setSymbol(result.symbol);
    setName(result.name);
  }

  function onSave() {
    upsert({ symbol, name, shares: Number(shares), averagePrice: Number(averagePrice) });
    setShares("");
    setAveragePrice("");
  }

  function edit(row: HoldingRow) {
    setSymbol(row.symbol);
    setName(row.name);
    setShares(String(row.shares));
    setAveragePrice(String(row.averagePrice));
  }

  return (
    <>
      <Header />
      <main className="page">
        <p className="crumb">
          <Link href="/">Home</Link> / Portfolio
        </p>
        <h1>Portfolio</h1>
        <p className="lede">
          Your lots stay in this browser only. Search a name, enter shares and average price, then
          save. This page is separate from the home watchlist.
        </p>

        <div className="holding-form">
          <SearchBox
            inputId="holding-search"
            placeholder="Search a holding…"
            onSelect={pick}
          />
          <input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="Symbol"
            aria-label="Symbol"
          />
          <input
            value={shares}
            onChange={(event) => setShares(event.target.value)}
            placeholder="Shares"
            inputMode="decimal"
            aria-label="Shares"
          />
          <input
            value={averagePrice}
            onChange={(event) => setAveragePrice(event.target.value)}
            placeholder="Avg price"
            inputMode="decimal"
            aria-label="Average price"
          />
          <button
            type="button"
            className="btn"
            disabled={!symbol || !shares || !averagePrice}
            onClick={onSave}
          >
            Save lot
          </button>
        </div>

        {holdings.length === 0 ? (
          <p className="lede">No holdings yet. Add a lot above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Shares</th>
                  <th>Avg price</th>
                  <th>Last price</th>
                  <th>P&L</th>
                  <th>{isValidating ? "Updating…" : ""}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.symbol}>
                    <td>
                      <Link href={`/stock/${row.symbol}`}>{row.name}</Link>
                      <div className="symbol">{row.symbol}</div>
                    </td>
                    <td>{row.shares}</td>
                    <td>{formatInr(row.averagePrice)}</td>
                    <td>{formatInr(row.price)}</td>
                    <td className={(row.pnl ?? 0) >= 0 ? "chg up" : "chg down"}>
                      {formatInr(row.pnl)} ({formatPercent(row.pnlPercent)})
                    </td>
                    <td>
                      <button type="button" className="btn btn-ghost" onClick={() => edit(row)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => remove(row.symbol)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
