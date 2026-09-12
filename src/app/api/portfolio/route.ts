import { NextRequest } from "next/server";
import { getQuote } from "@/lib/market-data/service";
import { DEFAULT_HOLDINGS, parseLotsQuery } from "@/lib/portfolio/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawLots = request.nextUrl.searchParams.get("lots");
  const holdings = rawLots === null ? DEFAULT_HOLDINGS : (parseLotsQuery(rawLots) ?? []);
  const rows = await Promise.all(
    holdings.map(async (holding) => {
      try {
        const quote = await getQuote(holding.symbol);
        const value = quote.price * holding.shares;
        const cost = holding.averagePrice * holding.shares;
        return {
          ...holding,
          name: holding.name === holding.symbol ? quote.name : holding.name,
          price: quote.price,
          changePercent: quote.changePercent,
          value,
          cost,
          pnl: value - cost,
          pnlPercent: cost ? ((value - cost) / cost) * 100 : 0,
          stale: quote.stale,
          lastSuccessfulUpdate: quote.lastSuccessfulUpdate,
          error: quote.error,
        };
      } catch {
        return {
          ...holding,
          price: null,
          changePercent: null,
          value: null,
          cost: holding.averagePrice * holding.shares,
          pnl: null,
          pnlPercent: null,
          stale: true,
          error: "Market data temporarily unavailable.",
        };
      }
    }),
  );
  return Response.json({ holdings: rows });
}
