import { NextRequest } from "next/server";
import { isUnknownSymbolError } from "@/lib/market-data/errors";
import { getSnapshot } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await context.params;
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const includeCandles = request.nextUrl.searchParams.get("chart") !== "0";
  try {
    const snapshot = await getSnapshot(symbol, { refresh, includeCandles });
    return Response.json(snapshot);
  } catch (error) {
    if (isUnknownSymbolError(error)) {
      return Response.json({ error: "Unknown NSE symbol", query: error.query }, { status: 404 });
    }
    return Response.json(
      { error: "Market data temporarily unavailable.", query: symbol },
      { status: 503 },
    );
  }
}
