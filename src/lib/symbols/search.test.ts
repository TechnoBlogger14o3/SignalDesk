import { describe, expect, it } from "vitest";
import { isNseListedQuote, mergeSearchResults } from "@/lib/symbols/search";
import { searchCatalog } from "@/lib/symbols/catalog";

describe("search merge", () => {
  it("keeps Yahoo / ETF hits even when the catalog already has several names", () => {
    const local = Array.from({ length: 8 }, (_, index) => ({
      symbol: `LOCAL${index}`,
      name: `Local ${index}`,
      exchange: "NSE" as const,
    }));
    const merged = mergeSearchResults(local, [
      { symbol: "SETFNIF50", name: "SBI Nifty 50 ETF", exchange: "NSE" },
    ]);
    expect(merged.some((item) => item.symbol === "SETFNIF50")).toBe(true);
    expect(merged[0].symbol).toBe("LOCAL0");
  });

  it("treats .NS and NSE ETF quotes as searchable", () => {
    expect(isNseListedQuote({ symbol: "SETFNIF50.NS" })).toBe(true);
    expect(isNseListedQuote({ symbol: "SETFNIF50", exchange: "NSI", quoteType: "ETF" })).toBe(true);
    expect(isNseListedQuote({ symbol: "AAPL", exchange: "NMS" })).toBe(false);
  });
});

describe("catalog search", () => {
  it("finds SBI ETF in the dropdown catalog", () => {
    const results = searchCatalog("SBI ETF");
    expect(results.some((item) => item.symbol === "SETFNIF50")).toBe(true);
  });
});
