"use client";

import { useEffect, useState } from "react";
import {
  WATCHLIST_EVENT,
  addToWatchlist,
  normalizeSymbol,
  readWatchlist,
  removeFromWatchlist,
} from "@/lib/watchlist/storage";

export function useWatchlist() {
  const [symbols, setSymbols] = useState(readWatchlist);

  useEffect(() => {
    function sync() {
      setSymbols(readWatchlist());
    }
    window.addEventListener(WATCHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    symbols,
    add: (symbol: string) => setSymbols(addToWatchlist(symbol)),
    remove: (symbol: string) => setSymbols(removeFromWatchlist(symbol)),
    has: (symbol: string) => symbols.includes(normalizeSymbol(symbol)),
  };
}
