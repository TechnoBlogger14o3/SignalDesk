import type { MarketDataProvider } from "@/lib/market-data/types";
import { YahooMarketDataProvider } from "@/lib/market-data/yahoo";
import { RestMarketDataProvider } from "@/lib/market-data/rest";

const globalForProvider = globalThis as unknown as { signalDeskProvider?: MarketDataProvider };

export function createMarketDataProvider(): MarketDataProvider {
  const driver = (process.env.MARKET_DATA_PROVIDER ?? "yahoo").toLowerCase();
  if (driver === "rest") return new RestMarketDataProvider();
  return new YahooMarketDataProvider();
}

export function getMarketDataProvider(): MarketDataProvider {
  if (process.env.NODE_ENV !== "development") {
    return createMarketDataProvider();
  }
  globalForProvider.signalDeskProvider ??= createMarketDataProvider();
  return globalForProvider.signalDeskProvider;
}
