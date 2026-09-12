import { NextRequest } from "next/server";
import { searchSymbols } from "@/lib/market-data/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (!query.trim()) {
    return Response.json([]);
  }
  const results = await searchSymbols(query);
  return Response.json(results);
}
