"use client";

import { useEffect, useState } from "react";
import type { Holding } from "@/lib/portfolio/holdings";
import {
  PORTFOLIO_EVENT,
  readHoldings,
  removeHolding,
  upsertHolding,
  writeHoldings,
} from "@/lib/portfolio/storage";

export function useHoldings() {
  const [holdings, setHoldings] = useState(readHoldings);

  useEffect(() => {
    function sync() {
      setHoldings(readHoldings());
    }
    window.addEventListener(PORTFOLIO_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PORTFOLIO_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    holdings,
    upsert: (holding: Partial<Holding>) => setHoldings(writeHoldings(upsertHolding(holdings, holding))),
    remove: (symbol: string) => setHoldings(writeHoldings(removeHolding(holdings, symbol))),
  };
}
