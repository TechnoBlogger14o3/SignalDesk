import { TEST_HOLDINGS } from "@/lib/portfolio/holdings";
import { getQuote } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await Promise.all(
    TEST_HOLDINGS.map(async (holding) => {
      try {
        const quote = await getQuote(holding.symbol);
        const value = quote.price * holding.shares;
        const cost = holding.averagePrice * holding.shares;
        return {
          ...holding,
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
