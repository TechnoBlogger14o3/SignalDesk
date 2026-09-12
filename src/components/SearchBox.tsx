"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/market-data/types";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";

export function SearchBox({
  onSelect,
  placeholder = "Search SBI ETF, HDFC, RELIANCE…",
  inputId = "stock-search",
}: {
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  inputId?: string;
}) {
  const router = useRouter();
  const watchlist = useWatchlist();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{ query: string; items: SearchResult[] }>({
    query: "",
    items: [],
  });
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const trimmed = query.trim();
  const visible = results.query === trimmed ? results.items : [];
  const searching = Boolean(trimmed) && results.query !== trimmed;

  useEffect(() => {
    if (!trimmed) return;
    const requested = trimmed;
    const handle = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(requested)}`);
        const data = (await response.json()) as SearchResult[];
        setResults({ query: requested, items: Array.isArray(data) ? data : [] });
        setActive(0);
      } catch {
        setResults({ query: requested, items: [] });
      }
    }, 180);
    return () => clearTimeout(handle);
  }, [trimmed]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function choose(result: SearchResult) {
    setOpen(false);
    setQuery("");
    if (onSelect) {
      onSelect(result);
      return;
    }
    router.push(`/stock/${result.symbol}`);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (visible[active]) choose(visible[active]);
  }

  return (
    <div ref={boxRef} className="search-wrap">
      <form onSubmit={onSubmit} role="search">
        <label className="sr-only" htmlFor={inputId}>
          Search NSE stocks and ETFs
        </label>
        <input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => trimmed && setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, Math.max(visible.length - 1, 0)));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
      </form>
      {open && trimmed ? (
        <ul className="search-results" role="listbox">
          {searching ? <li className="search-empty">Searching…</li> : null}
          {!searching && visible.length === 0 ? <li className="search-empty">No matching NSE stock or ETF.</li> : null}
          {visible.map((item, index) => {
            const saved = watchlist.has(item.symbol);
            return (
              <li key={item.symbol}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={index === active ? "active" : undefined}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item)}
                >
                  <strong>{item.symbol}</strong>
                  <span>{item.name}</span>
                </button>
                <button
                  type="button"
                  className="search-add"
                  title={saved ? "On watchlist" : "Add to watchlist"}
                  onClick={() => (saved ? watchlist.remove(item.symbol) : watchlist.add(item.symbol))}
                >
                  {saved ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
