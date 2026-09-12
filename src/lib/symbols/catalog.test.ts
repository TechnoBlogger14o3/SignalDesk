import { describe, expect, it } from "vitest";
import { resolveNseSymbol, searchCatalog } from "@/lib/symbols/catalog";

describe("NSE symbol mapping", () => {
  it("maps common aliases to official NSE symbols", () => {
    expect(resolveNseSymbol("HDFC")?.symbol).toBe("HDFCBANK");
    expect(resolveNseSymbol("hdfcbank")?.symbol).toBe("HDFCBANK");
    expect(resolveNseSymbol("KAYNES")?.symbol).toBe("KAYNES");
    expect(resolveNseSymbol("Kaynes Technology")?.symbol).toBe("KAYNES");
    expect(resolveNseSymbol("SBI")?.symbol).toBe("SBIN");
    expect(resolveNseSymbol("L&T")?.symbol).toBe("LT");
    expect(resolveNseSymbol("RELIANCE")?.symbol).toBe("RELIANCE");
    expect(resolveNseSymbol("TCS")?.symbol).toBe("TCS");
    expect(resolveNseSymbol("INFY")?.symbol).toBe("INFY");
    expect(resolveNseSymbol("IOCL")?.symbol).toBe("IOC");
    expect(resolveNseSymbol("Indian Oil")?.symbol).toBe("IOC");
    expect(resolveNseSymbol("HPCL")?.symbol).toBe("HINDPETRO");
  });

  it("does not accept arbitrary unsuffixed input as a valid symbol", () => {
    expect(resolveNseSymbol("NOTASTOCK")).toBeUndefined();
    expect(resolveNseSymbol("AAAA.NS")).toBeUndefined();
  });

  it("returns catalog search matches for IOCL", () => {
    const results = searchCatalog("IOCL");
    expect(results.some((item) => item.symbol === "IOC")).toBe(true);
  });

  it("returns no matches for an unknown query", () => {
    expect(searchCatalog("ZZZNOTASTOCK")).toEqual([]);
  });
});
