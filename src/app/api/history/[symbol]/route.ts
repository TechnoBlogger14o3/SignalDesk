import { NextRequest } from "next/server";
import { isUnknownSymbolError } from "@/lib/market-data/errors";
import { getHistory } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params;
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  try {
    const candles = await getHistory(symbol, refresh);
    return Response.json({
      symbol: symbol.toUpperCase(),
      exchange: "NSE",
      count: candles.length,
      candles,
    });
  } catch (error) {
    if (isUnknownSymbolError(error)) {
      return Response.json({ error: "Unknown NSE symbol", query: error.query }, { status: 404 });
    }
    return Response.json(
      { error: "Historical market data temporarily unavailable.", query: symbol },
      { status: 503 },
    );
  }
}
