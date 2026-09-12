export class UnknownSymbolError extends Error {
  constructor(public query: string) {
    super(`Unknown or unsupported NSE symbol: ${query}`);
    this.name = "UnknownSymbolError";
  }
}

export class MarketDataError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "MarketDataError";
  }
}

export function isUnknownSymbolError(error: unknown): error is UnknownSymbolError {
  return error instanceof UnknownSymbolError || (error instanceof Error && error.name === "UnknownSymbolError");
}
