"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/market-data/types";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const visibleResults = query.trim() ? results : [];

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const handle = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = (await response.json()) as SearchResult[];
      setResults(data);
      setOpen(true);
      setActive(0);
    }, 180);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(symbol: string) {
    setOpen(false);
    setQuery("");
    router.push(`/stock/${symbol}`);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (visibleResults[active]) {
      go(visibleResults[active].symbol);
      return;
    }
    const typed = query.trim();
    if (!typed) return;
    const response = await fetch(`/api/search?q=${encodeURIComponent(typed)}`);
    const data = (await response.json()) as SearchResult[];
    if (data[0]) {
      go(data[0].symbol);
      return;
    }
    go(typed.toUpperCase());
  }

  return (
    <div ref={boxRef} className="search-wrap">
      <form onSubmit={onSubmit} role="search">
        <label className="sr-only" htmlFor="stock-search">
          Search NSE stocks
        </label>
        <input
          id="stock-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => visibleResults.length && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, Math.max(visibleResults.length - 1, 0)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            }
          }}
          placeholder="Search HDFC, KAYNES, RELIANCE…"
          autoComplete="off"
        />
      </form>
      {open && query.trim() ? (
        <ul className="search-results">
          {visibleResults.length === 0 ? (
            <li className="search-empty">No matching NSE stocks.</li>
          ) : (
            visibleResults.map((item, index) => (
              <li key={item.symbol}>
                <button
                  type="button"
                  className={index === active ? "active" : undefined}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(item.symbol)}
                >
                  <strong>{item.symbol}</strong>
                  <span>{item.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
