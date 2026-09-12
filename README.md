# SignalDesk

SignalDesk is an Indian stock-market analysis dashboard. It shows **current price**, **near-term targets**, a **long-term scenario target**, and **entry/exit guidance** from live market data.

This is not investment advice. Targets are analytical scenarios, not guaranteed predictions.

Released under the [MIT License](LICENSE).

The browser never talks to Yahoo Finance or any market-data vendor. All market calls go:

`Frontend → Next.js API routes → market-data provider (default: Yahoo Finance on the server)`

Targets are analytical scenarios, not guaranteed predictions.

## Stack

- Next.js 16 (App Router) + TypeScript
- React 19
- SQLite cache via Node's built-in `node:sqlite`
- Yahoo Finance through `yahoo-finance2` on the server

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

The default provider does **not** need an API key. Yahoo Finance is queried only from the backend.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MARKET_DATA_PROVIDER` | No | `yahoo` (default) or `rest` |
| `MARKET_DATA_API_KEY` | Only for `rest` | Sent as `Authorization: Bearer …` |
| `MARKET_DATA_BASE_URL` | Only for `rest` | Base URL of a replaceable market-data service |
| `MARKET_DATA_CACHE_PATH` | No | SQLite cache file. Default: `data/cache.sqlite` |
| `TECH_WEIGHT_*` | No | Technical score weights |

Never put vendor secrets in frontend code or `NEXT_PUBLIC_*` variables.

### Swapping the market-data provider

Set `MARKET_DATA_PROVIDER=rest` and point `MARKET_DATA_BASE_URL` at a service that exposes:

- `GET /quote/{symbol}`
- `GET /history/{symbol}`
- `GET /search?q=`
- `GET /fundamentals/{symbol}` (optional; omitted fields are skipped)

The frontend does not change.

## API

- `GET /api/quote/HDFCBANK`
- `GET /api/history/HDFCBANK`
- `GET /api/search?q=HDFC`
- `GET /api/snapshot/HDFCBANK`
- `GET /api/watchlist`
- `GET /api/market-status`
- `GET /api/portfolio` (test holdings only; not shown on the home page)

Add `?refresh=1` to bypass TTL and fetch again. If the vendor fails, cached prices are returned when available.

## Pages

- `/` Watchlist. Search as you type, then **Add**. The list is stored in this browser (`localStorage`), starting from a default set of liquid NSE names.
- `/stock/HDFCBANK` full setup, chart, scores, and scenarios
- `/portfolio` editable lots in this browser (starts with a small demo book you can change)

## Market hours

NSE session handling uses IST:

- Pre-open: 09:00–09:15
- Open: 09:15–15:30
- Post-market: 15:30–16:00
- Closed otherwise, including weekends and 2026 NSE holidays

Auto-refresh runs every 5 minutes only while the market is open. Use **Refresh now** at any time.

## Analysis

Technical score (configurable weights):

- Trend 35%
- Momentum 20%
- Volume 15%
- Breakout 15%
- Support/resistance 15%

Entry states: `ENTRY NOW`, `BUY ON DIP`, `ACCUMULATE`, `WAIT`, `HOLD`, `REDUCE`, `EXIT`.

Long-term targets use reported growth / valuation when Yahoo provides them, otherwise the 200-day trend. Missing fundamentals are omitted rather than invented.

## Scripts

```bash
npm run dev
npm test
npm run build
```

## Notes

- Search understands aliases such as `HDFC` → `HDFCBANK`, `SBI` → `SBIN`, `SBI ETF` → `SETFNIF50`, `KAYNES` → Kaynes Technology. The dropdown also asks Yahoo for other NSE stocks and ETFs as you type.
- Arbitrary input is not assumed to be an NSE symbol. `.NS` is added only after the symbol is validated.
- If a live quote cannot be fetched, the UI shows the last available price and last successful update, with Retry.
