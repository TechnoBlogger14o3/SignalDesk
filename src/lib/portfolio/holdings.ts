export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  averagePrice: number;
}

export const TEST_HOLDINGS: Holding[] = [
  { symbol: "HDFCBANK", name: "HDFC Bank", shares: 900, averagePrice: 768 },
  { symbol: "KAYNES", name: "Kaynes Technology", shares: 29, averagePrice: 3405 },
];
