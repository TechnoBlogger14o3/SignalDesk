import type { MarketSession } from "@/lib/market-data/types";

const IST = "Asia/Kolkata";

const NSE_HOLIDAYS = new Set([
  "2026-01-15",
  "2026-01-26",
  "2026-03-03",
  "2026-03-26",
  "2026-03-31",
  "2026-04-03",
  "2026-04-14",
  "2026-05-01",
  "2026-05-28",
  "2026-06-26",
  "2026-09-14",
  "2026-10-02",
  "2026-10-20",
  "2026-11-10",
  "2026-11-24",
  "2026-12-25",
]);

export interface MarketClock {
  status: MarketSession;
  isOpen: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  dateIst: string;
  timeIst: string;
  label: string;
}

function istParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return {
    dateIst: `${year}-${month}-${day}`,
    weekday: get("weekday"),
    minutes: hour * 60 + minute,
    timeIst: `${get("hour")}:${get("minute")}`,
  };
}

export function getMarketClock(now = new Date()): MarketClock {
  const { dateIst, weekday, minutes, timeIst } = istParts(now);
  const isWeekend = weekday === "Sat" || weekday === "Sun";
  const isHoliday = NSE_HOLIDAYS.has(dateIst);

  let status: MarketSession = "CLOSED";
  if (!isWeekend && !isHoliday) {
    if (minutes >= 9 * 60 && minutes < 9 * 60 + 15) status = "PRE-OPEN";
    else if (minutes >= 9 * 60 + 15 && minutes < 15 * 60 + 30) status = "OPEN";
    else if (minutes >= 15 * 60 + 30 && minutes < 16 * 60) status = "POST-MARKET";
  }

  const labels: Record<MarketSession, string> = {
    OPEN: "Market Open",
    CLOSED: "Market Closed",
    "PRE-OPEN": "Pre-Open",
    "POST-MARKET": "Post-Market",
  };

  return {
    status,
    isOpen: status === "OPEN",
    isWeekend,
    isHoliday,
    dateIst,
    timeIst,
    label: labels[status],
  };
}

export function shouldAutoRefresh(now = new Date()): boolean {
  return getMarketClock(now).isOpen;
}

export function quoteCacheTtlMs(now = new Date()): number {
  return getMarketClock(now).isOpen ? 60_000 : 30 * 60_000;
}

export function historyCacheTtlMs(now = new Date()): number {
  return getMarketClock(now).isOpen ? 5 * 60_000 : 6 * 60 * 60_000;
}

export function formatIstTimestamp(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const month = get("month").replace("Sept", "Sep");
  const day = get("day");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const dayPeriod = get("dayPeriod").toUpperCase();
  return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod} IST`;
}

export function toIstIso(value: Date | number): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+05:30`;
}

export function addCalendarMonths(base: Date, months: number): Date {
  const copy = new Date(base);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatYearRange(start: Date, end: Date): string {
  const startYear = new Intl.DateTimeFormat("en-GB", { timeZone: IST, year: "numeric" }).format(start);
  const endYear = new Intl.DateTimeFormat("en-GB", { timeZone: IST, year: "numeric" }).format(end);
  return startYear === endYear ? startYear : `${startYear}–${endYear}`;
}
