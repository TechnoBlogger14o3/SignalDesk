import { describe, expect, it } from "vitest";
import { parseHoldings, parseLotsQuery, sanitizeHolding, upsertHolding } from "@/lib/portfolio/storage";

describe("portfolio holdings", () => {
  it("rejects incomplete lots", () => {
    expect(sanitizeHolding({ symbol: "HDFCBANK", shares: 0, averagePrice: 768 })).toBeNull();
    expect(sanitizeHolding({ symbol: "", shares: 10, averagePrice: 100 })).toBeNull();
  });

  it("parses a lots query string", () => {
    expect(parseLotsQuery("HDFCBANK:900:768|KAYNES:29:3405")).toEqual([
      { symbol: "HDFCBANK", name: "HDFCBANK", shares: 900, averagePrice: 768 },
      { symbol: "KAYNES", name: "KAYNES", shares: 29, averagePrice: 3405 },
    ]);
    expect(parseLotsQuery("")).toEqual([]);
    expect(parseLotsQuery(null)).toBeNull();
  });

  it("updates an existing holding instead of duplicating it", () => {
    const next = upsertHolding(
      [{ symbol: "HDFCBANK", name: "HDFC Bank", shares: 900, averagePrice: 768 }],
      { symbol: "hdfcbank", name: "HDFC Bank", shares: 1000, averagePrice: 770 },
    );
    expect(next).toHaveLength(1);
    expect(next[0].shares).toBe(1000);
    expect(next[0].averagePrice).toBe(770);
  });

  it("returns an empty book when stored data is an empty array", () => {
    expect(parseHoldings([], [{ symbol: "HDFCBANK", name: "HDFC Bank", shares: 1, averagePrice: 1 }])).toEqual([]);
  });
});
