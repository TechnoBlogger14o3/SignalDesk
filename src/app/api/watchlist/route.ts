import { NextRequest } from "next/server";
import { getWatchlist } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const watchlist = await getWatchlist(refresh);
  return Response.json({ stocks: watchlist });
}
