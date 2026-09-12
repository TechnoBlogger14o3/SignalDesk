import { describe, expect, it } from "vitest";
import { formatIstTimestamp, getMarketClock } from "@/lib/market-hours";

function atIst(isoDate: string, hour: number, minute: number): Date {
  return new Date(`${isoDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+05:30`);
}

describe("NSE market hours", () => {
  it("marks a Thursday 10:00 IST as open", () => {
    const clock = getMarketClock(atIst("2026-09-10", 10, 0));
    expect(clock.status).toBe("OPEN");
    expect(clock.isOpen).toBe(true);
  });

  it("marks 09:05 IST as pre-open", () => {
    expect(getMarketClock(atIst("2026-09-10", 9, 5)).status).toBe("PRE-OPEN");
  });

  it("marks 15:45 IST as post-market", () => {
    expect(getMarketClock(atIst("2026-09-10", 15, 45)).status).toBe("POST-MARKET");
  });

  it("marks 19:41 IST as closed", () => {
    expect(getMarketClock(atIst("2026-09-10", 19, 41)).status).toBe("CLOSED");
  });

  it("treats weekends as closed", () => {
    expect(getMarketClock(atIst("2026-09-12", 11, 0)).status).toBe("CLOSED");
  });

  it("treats Ganesh Chaturthi 2026 as a holiday", () => {
    expect(getMarketClock(atIst("2026-09-14", 11, 0)).isHoliday).toBe(true);
    expect(getMarketClock(atIst("2026-09-14", 11, 0)).status).toBe("CLOSED");
  });

  it("formats last-updated labels in IST", () => {
    const label = formatIstTimestamp(new Date("2026-09-10T11:32:00+05:30"));
    expect(label).toBe("10 Sep 2026, 11:32 AM IST");
  });
});
