"use client";

import useSWR from "swr";
import Link from "next/link";
import { Header } from "@/components/Header";
import { formatInr, formatPercent } from "@/lib/format";

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
  const { data } = useSWR<{ holdings: HoldingRow[] }>("/api/portfolio", (url: string) =>
    fetch(url).then((response) => response.json()),
  );

  return (
    <>
      <Header />
      <main className="page">
        <p className="crumb">
          <Link href="/">Home</Link> / Portfolio
        </p>
        <h1>Portfolio</h1>
        <p className="lede">
          Test holdings only. This page is separate from the market watchlist on the home screen.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stock</th>
                <th>Shares</th>
                <th>Avg price</th>
                <th>Last price</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {(data?.holdings ?? []).map((row) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
