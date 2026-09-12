"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { IChartApi, ISeriesApi, LogicalRange, SeriesType, Time } from "lightweight-charts";
import type { Candle, CandlePattern } from "@/lib/market-data/types";
import { formatInr, formatPercent, formatVolume } from "@/lib/format";
import {
  CHART_RANGES,
  CHART_STYLES,
  overlayEma,
  prepareSeries,
  toChartTime,
  toCloseLine,
  toOhlc,
  toVolume,
  type ChartInterval,
  type ChartLevel,
  type ChartRange,
  type ChartStyle,
} from "@/lib/analysis/chart";

const STYLE_KEY = "signaldesk.chart.style";
const RANGE_KEY = "signaldesk.chart.range";
const INTERVAL_KEY = "signaldesk.chart.interval";
const OVERLAY_KEY = "signaldesk.chart.overlays";

type OverlayPrefs = {
  volume: boolean;
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  levels: boolean;
};

const DEFAULT_OVERLAYS: OverlayPrefs = {
  volume: true,
  ema20: true,
  ema50: true,
  ema200: true,
  levels: true,
};

const EMA_STYLES = [
  { id: "ema20" as const, period: 20, color: "#fbbf24", label: "EMA 20" },
  { id: "ema50" as const, period: 50, color: "#60a5fa", label: "EMA 50" },
  { id: "ema200" as const, period: 200, color: "#c084fc", label: "EMA 200" },
];

function readStored<T extends string>(key: string, allowed: T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function readOverlays(): OverlayPrefs {
  if (typeof window === "undefined") return DEFAULT_OVERLAYS;
  try {
    const raw = window.localStorage.getItem(OVERLAY_KEY);
    if (!raw) return DEFAULT_OVERLAYS;
    return { ...DEFAULT_OVERLAYS, ...(JSON.parse(raw) as Partial<OverlayPrefs>) };
  } catch {
    return DEFAULT_OVERLAYS;
  }
}

function barsAgoLabel(barsAgo: number): string {
  if (barsAgo === 0) return "Latest session";
  if (barsAgo === 1) return "1 session ago";
  return `${barsAgo} sessions ago`;
}

function StyleIcon({ style }: { style: ChartStyle }) {
  const stroke = "currentColor";
  if (style === "line") {
    return (
      <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
        <path d="M2 12 L6 8 L10 11 L16 4" fill="none" stroke={stroke} strokeWidth="1.6" />
      </svg>
    );
  }
  if (style === "area") {
    return (
      <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
        <path d="M2 13 L6 8 L10 11 L16 5 V16 H2 Z" fill="currentColor" opacity="0.35" />
        <path d="M2 13 L6 8 L10 11 L16 5" fill="none" stroke={stroke} strokeWidth="1.4" />
      </svg>
    );
  }
  if (style === "bars") {
    return (
      <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
        <path d="M5 4 V14 M3 7 H5 M5 12 H7 M13 3 V14 M11 6 H13 M13 11 H15" stroke={stroke} strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  if (style === "baseline") {
    return (
      <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
        <path d="M2 10 H16" stroke={stroke} opacity="0.45" />
        <path d="M2 10 L7 6 L11 9 L16 4 V10 Z" fill="#34d399" opacity="0.45" />
        <path d="M2 10 L5 13 L9 11 L16 14 V10 Z" fill="#f87171" opacity="0.45" />
      </svg>
    );
  }
  const hollow = style === "hollow";
  return (
    <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
      <rect x="3" y="7" width="5" height="6" fill={hollow ? "none" : "currentColor"} stroke={stroke} />
      <line x1="5.5" x2="5.5" y1="4" y2="7" stroke={stroke} />
      <line x1="5.5" x2="5.5" y1="13" y2="15" stroke={stroke} />
      <rect x="10" y="5" width="5" height="7" fill="currentColor" />
      <line x1="12.5" x2="12.5" y1="3" y2="5" stroke={stroke} />
      <line x1="12.5" x2="12.5" y1="12" y2="15" stroke={stroke} />
    </svg>
  );
}

function ToolIcon({ name }: { name: "fit" | "full" | "fx" }) {
  if (name === "fit") {
    return (
      <svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true">
        <path d="M3 7 V3 H7 M11 3 H15 V7 M15 11 V15 H11 M7 15 H3 V11" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "full") {
    return (
      <svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true">
        <path d="M3 7 V3 H7 M11 3 H15 V7 M15 11 V15 H11 M7 15 H3 V11" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6" y="6" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 18 18" width="15" height="15" aria-hidden="true">
      <path d="M3 13 L7 7 L11 10 L15 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="7" cy="7" r="1.3" fill="currentColor" />
      <circle cx="11" cy="10" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function PriceChart({
  candles,
  patterns = [],
  levels = [],
}: {
  candles: Candle[];
  patterns?: CandlePattern[];
  levels?: ChartLevel[];
}) {
  const [style, setStyle] = useState<ChartStyle>(() =>
    readStored(STYLE_KEY, CHART_STYLES.map((item) => item.id), "candles"),
  );
  const [range, setRange] = useState<ChartRange>(() => readStored(RANGE_KEY, CHART_RANGES, "1Y"));
  const [interval, setInterval] = useState<ChartInterval>(() =>
    readStored<ChartInterval>(INTERVAL_KEY, ["D", "W"], "D"),
  );
  const [overlays, setOverlays] = useState<OverlayPrefs>(readOverlays);
  const [menu, setMenu] = useState<"type" | "fx" | null>(null);
  const [hover, setHover] = useState<Candle | null>(null);
  const [userLines, setUserLines] = useState<number[]>([]);
  const [fitNonce, setFitNonce] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimeRef = useRef<string | null>(null);
  const visibleRangeRef = useRef<LogicalRange | null>(null);
  const fitTokenRef = useRef<string>("");

  useEffect(() => {
    window.localStorage.setItem(STYLE_KEY, style);
    window.localStorage.setItem(RANGE_KEY, range);
    window.localStorage.setItem(INTERVAL_KEY, interval);
    window.localStorage.setItem(OVERLAY_KEY, JSON.stringify(overlays));
  }, [style, range, interval, overlays]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(null);
    }
    function onFullscreen() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  const series = useMemo(
    () => prepareSeries(candles, { range, interval, style }),
    [candles, range, interval, style],
  );
  const byTime = useMemo(() => {
    const map = new Map<string, Candle>();
    for (const candle of series) map.set(toChartTime(candle.date), candle);
    return map;
  }, [series]);
  const patternByTime = useMemo(() => {
    const map = new Map<string, CandlePattern>();
    for (const pattern of patterns) map.set(toChartTime(pattern.date), pattern);
    return map;
  }, [patterns]);

  const showPatterns = (style === "candles" || style === "hollow" || style === "bars") && interval === "D";
  const lastBar = series.at(-1);
  const viewKey = `${interval}|${range}|${series[0]?.date ?? ""}|${lastBar?.date ?? ""}|${series.length}`;
  const paintKey = [
    viewKey,
    style,
    lastBar?.close ?? "",
    lastBar?.volume ?? "",
    overlays.volume,
    overlays.ema20,
    overlays.ema50,
    overlays.ema200,
    overlays.levels,
    levels.map((level) => `${level.label}:${level.price}`).join(","),
    userLines.join(","),
    showPatterns ? "1" : "0",
    patterns.map((pattern) => `${pattern.date}:${pattern.name}`).join(","),
    fitNonce,
  ].join("|");

  useEffect(() => {
    const host = hostRef.current;
    if (!host || series.length === 0) return;
    let disposed = false;
    let chart: IChartApi | undefined;
    const ohlc = toOhlc(series);
    const closes = toCloseLine(series);
    const volume = toVolume(series);

    void import("lightweight-charts").then((lc) => {
      if (disposed || !hostRef.current) return;
      const instance = lc.createChart(hostRef.current, {
        autoSize: true,
        layout: {
          background: { type: lc.ColorType.Solid, color: "#10161e" },
          textColor: "#8b9cb0",
          fontFamily: "inherit",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.05)" },
          horzLines: { color: "rgba(255,255,255,0.05)" },
        },
        crosshair: {
          mode: lc.CrosshairMode.Magnet,
          vertLine: {
            color: "rgba(94, 234, 212, 0.45)",
            width: 1,
            style: lc.LineStyle.Dashed,
            labelBackgroundColor: "#1c2733",
          },
          horzLine: {
            color: "rgba(94, 234, 212, 0.45)",
            width: 1,
            style: lc.LineStyle.Dashed,
            labelBackgroundColor: "#1c2733",
          },
        },
        rightPriceScale: {
          borderColor: "#243040",
          scaleMargins: { top: 0.06, bottom: overlays.volume ? 0.22 : 0.06 },
        },
        timeScale: {
          borderColor: "#243040",
          rightOffset: 6,
          barSpacing: interval === "W" ? 10 : 7,
          minBarSpacing: 3,
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      });
      chart = instance;

      const up = "#34d399";
      const down = "#f87171";
      let main: ISeriesApi<SeriesType>;
      if (style === "line") {
        main = instance.addSeries(lc.LineSeries, {
          color: "#5eead4",
          lineWidth: 2,
          lastValueVisible: true,
          priceLineVisible: false,
        });
        main.setData(closes);
      } else if (style === "area") {
        main = instance.addSeries(lc.AreaSeries, {
          lineColor: "#5eead4",
          topColor: "rgba(94, 234, 212, 0.28)",
          bottomColor: "rgba(94, 234, 212, 0.02)",
          lineWidth: 2,
          priceLineVisible: false,
        });
        main.setData(closes);
      } else if (style === "baseline") {
        main = instance.addSeries(lc.BaselineSeries, {
          baseValue: { type: "price", price: series[0]?.close ?? 0 },
          topLineColor: up,
          topFillColor1: "rgba(52, 211, 153, 0.28)",
          topFillColor2: "rgba(52, 211, 153, 0.03)",
          bottomLineColor: down,
          bottomFillColor1: "rgba(248, 113, 113, 0.03)",
          bottomFillColor2: "rgba(248, 113, 113, 0.28)",
          lineWidth: 2,
          priceLineVisible: false,
        });
        main.setData(closes);
      } else if (style === "bars") {
        main = instance.addSeries(lc.BarSeries, {
          upColor: up,
          downColor: down,
          thinBars: false,
          priceLineVisible: false,
        });
        main.setData(ohlc);
      } else {
        main = instance.addSeries(lc.CandlestickSeries, {
          upColor: style === "hollow" ? "rgba(16, 22, 30, 0)" : up,
          downColor: down,
          borderUpColor: up,
          borderDownColor: down,
          wickUpColor: up,
          wickDownColor: down,
          borderVisible: style === "hollow",
          priceLineVisible: false,
        });
        main.setData(ohlc);
      }

      if (overlays.volume) {
        const histogram = instance.addSeries(lc.HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "",
          lastValueVisible: false,
          priceLineVisible: false,
        });
        histogram.priceScale().applyOptions({
          scaleMargins: { top: 0.78, bottom: 0 },
        });
        histogram.setData(volume);
      }

      for (const ema of EMA_STYLES) {
        if (!overlays[ema.id]) continue;
        const points = overlayEma(series, ema.period);
        if (points.length === 0) continue;
        const line = instance.addSeries(lc.LineSeries, {
          color: ema.color,
          lineWidth: 1,
          lastValueVisible: true,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        });
        line.setData(points);
      }

      if (overlays.levels) {
        for (const level of levels) {
          if (!Number.isFinite(level.price)) continue;
          main.createPriceLine({
            price: level.price,
            color: level.color,
            lineWidth: 1,
            lineStyle: lc.LineStyle.Dashed,
            axisLabelVisible: true,
            title: level.label,
          });
        }
      }
      for (const price of userLines) {
        main.createPriceLine({
          price,
          color: "#5eead4",
          lineWidth: 1,
          lineStyle: lc.LineStyle.Solid,
          axisLabelVisible: true,
          title: "Line",
        });
      }

      if (showPatterns) {
        lc.createSeriesMarkers(
          main,
          patterns.flatMap((pattern) => {
            const time = toChartTime(pattern.date);
            if (!byTime.has(time)) return [];
            const bearish = pattern.bias === "Bearish";
            return [
              {
                time: time as Time,
                position: bearish ? "aboveBar" : "belowBar",
                shape: bearish ? "arrowDown" : pattern.bias === "Bullish" ? "arrowUp" : "circle",
                color: bearish ? down : pattern.bias === "Bullish" ? up : "#fbbf24",
                text: pattern.name,
              },
            ];
          }),
        );
      }

      const shouldFit = fitTokenRef.current !== viewKey;
      fitTokenRef.current = viewKey;
      if (shouldFit || !visibleRangeRef.current) {
        instance.timeScale().fitContent();
      } else {
        instance.timeScale().setVisibleLogicalRange(visibleRangeRef.current);
      }

      instance.timeScale().subscribeVisibleLogicalRangeChange((next) => {
        if (next) visibleRangeRef.current = next;
      });

      instance.subscribeCrosshairMove((param) => {
        const time = param.time === undefined ? null : String(param.time);
        if (time === hoverTimeRef.current) return;
        hoverTimeRef.current = time;
        setHover(time ? (byTime.get(time) ?? null) : null);
      });

      instance.subscribeDblClick((param) => {
        if (!param.point) return;
        const price = main.coordinateToPrice(param.point.y);
        if (price === null || !Number.isFinite(price)) return;
        setUserLines((current) => [...current, Number(price)]);
      });
    });

    return () => {
      disposed = true;
      chart?.remove();
    };
    // paintKey is a digest of series, style, overlays, levels, and drawings.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paintKey]);

  if (series.length === 0) return null;

  const active = hover ?? series[series.length - 1];
  const activeIndex = hover ? series.indexOf(hover) : series.length - 1;
  const prev = series[Math.max(activeIndex - 1, 0)];
  const changePct = prev && prev.close ? ((active.close - prev.close) / prev.close) * 100 : 0;
  const upLast =
    style === "line" || style === "area" || style === "baseline"
      ? active.close >= (prev?.close ?? active.open)
      : active.close >= active.open;
  const styleLabel = CHART_STYLES.find((item) => item.id === style)?.label ?? "Candles";
  const hoveredPattern = showPatterns ? patternByTime.get(toChartTime(active.date)) : undefined;
  const emaLegend = EMA_STYLES.filter((item) => overlays[item.id]);

  async function toggleFullscreen() {
    const node = wrapRef.current;
    if (!node) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await node.requestFullscreen();
  }

  function fitChart() {
    visibleRangeRef.current = null;
    fitTokenRef.current = "";
    setFitNonce((nonce) => nonce + 1);
  }

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <div className="chart-toolbar">
        <div className="chart-groups">
          <div className="chart-group" role="tablist" aria-label="Interval">
            {(["D", "W"] as ChartInterval[]).map((item) => (
              <button
                key={item}
                type="button"
                className={interval === item ? "active" : undefined}
                onClick={() => setInterval(item)}
              >
                {item === "D" ? "1D" : "1W"}
              </button>
            ))}
          </div>
          <div className="chart-group" role="tablist" aria-label="Range">
            {CHART_RANGES.map((item) => (
              <button
                key={item}
                type="button"
                className={range === item ? "active" : undefined}
                onClick={() => setRange(item)}
              >
                {item === "ALL" ? "All" : item}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-tools" ref={menuRef}>
          <div className="chart-type">
            <button
              type="button"
              className="chart-type-btn"
              aria-haspopup="menu"
              aria-expanded={menu === "fx"}
              onClick={() => setMenu((open) => (open === "fx" ? null : "fx"))}
            >
              <ToolIcon name="fx" />
              <span>Indicators</span>
            </button>
            {menu === "fx" ? (
              <ul className="chart-type-menu" role="menu">
                {(
                  [
                    ["volume", "Volume"],
                    ["ema20", "EMA 20"],
                    ["ema50", "EMA 50"],
                    ["ema200", "EMA 200"],
                    ["levels", "S/R · targets"],
                  ] as const
                ).map(([id, label]) => (
                  <li key={id}>
                    <button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={overlays[id]}
                      className={overlays[id] ? "active" : undefined}
                      onClick={() => setOverlays((current) => ({ ...current, [id]: !current[id] }))}
                    >
                      {label}
                    </button>
                  </li>
                ))}
                {userLines.length > 0 ? (
                  <li>
                    <button type="button" onClick={() => setUserLines([])}>
                      Clear drawings
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
          <div className="chart-type">
            <button
              type="button"
              className="chart-type-btn"
              aria-haspopup="menu"
              aria-expanded={menu === "type"}
              onClick={() => setMenu((open) => (open === "type" ? null : "type"))}
            >
              <StyleIcon style={style} />
              <span>{styleLabel}</span>
            </button>
            {menu === "type" ? (
              <ul className="chart-type-menu" role="menu">
                {CHART_STYLES.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="menuitem"
                      className={style === item.id ? "active" : undefined}
                      onClick={() => {
                        setStyle(item.id);
                        setMenu(null);
                      }}
                    >
                      <StyleIcon style={item.id} />
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button type="button" className="chart-icon-btn" title="Fit content" onClick={fitChart}>
            <ToolIcon name="fit" />
            <span className="sr-only">Fit content</span>
          </button>
          <button
            type="button"
            className="chart-icon-btn"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={() => void toggleFullscreen()}
          >
            <ToolIcon name="full" />
            <span className="sr-only">{fullscreen ? "Exit fullscreen" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      <div className="chart-legend">
        <span className={upLast ? "chg up" : "chg down"}>
          O {formatInr(active.open)} &nbsp; H {formatInr(active.high)} &nbsp; L {formatInr(active.low)} &nbsp; C{" "}
          {formatInr(active.close)} &nbsp; {formatPercent(changePct)}
        </span>
        <span className="muted">
          Vol {formatVolume(active.volume)}
          {emaLegend.length > 0 ? ` · ${emaLegend.map((item) => item.label).join(" · ")}` : ""}
          {hoveredPattern ? ` · ${hoveredPattern.name}` : ""}
        </span>
      </div>

      <div ref={hostRef} className="chart-canvas" role="img" aria-label={`${styleLabel} chart`} />

      {showPatterns ? (
        <p className="chart-note">
          {patterns[0]
            ? `Pattern markers on · latest ${patterns[0].name} (${barsAgoLabel(patterns[0].barsAgo)}). Double-click to pin a price line.`
            : "No classic candlestick reversal in the last few sessions. Double-click the chart to pin a price line."}
        </p>
      ) : (
        <p className="chart-note">
          Scroll to zoom, drag to pan. Chart uses SignalDesk market data, not TradingView’s feed.
        </p>
      )}
    </div>
  );
}

export { barsAgoLabel };
