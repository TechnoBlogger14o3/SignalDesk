import { NextRequest } from "next/server";
import { getWatchlist } from "@/lib/market-data/service";
import { parseSymbolQuery } from "@/lib/watchlist/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const symbols = parseSymbolQuery(request.nextUrl.searchParams.get("symbols"));
  const watchlist = await getWatchlist(refresh, symbols);
  return Response.json({ stocks: watchlist });
}
