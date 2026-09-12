import { describe, expect, it } from "vitest";
import { parseWatchlist, sanitizeSymbols } from "@/lib/watchlist/storage";

describe("watchlist symbols", () => {
  it("keeps unique uppercase NSE tickers and caps the list", () => {
    expect(sanitizeSymbols(["hdfcbank", "HDFCBANK.NS", "KAYNES", "", "hdfcbank"], 2)).toEqual([
      "HDFCBANK",
      "KAYNES",
    ]);
  });

  it("uses the default list only when stored data is invalid", () => {
    expect(parseWatchlist(null, ["RELIANCE"])).toEqual(["RELIANCE"]);
    expect(parseWatchlist([], ["RELIANCE"])).toEqual([]);
    expect(parseWatchlist(["sbin"], ["RELIANCE"])).toEqual(["SBIN"]);
  });
});
