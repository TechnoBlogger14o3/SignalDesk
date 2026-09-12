import { formatIstTimestamp, getMarketClock, shouldAutoRefresh } from "@/lib/market-hours";

export const dynamic = "force-dynamic";

export async function GET() {
  const clock = getMarketClock();
  return Response.json({
    status: clock.status,
    label: clock.label,
    isOpen: clock.isOpen,
    isHoliday: clock.isHoliday,
    isWeekend: clock.isWeekend,
    dateIst: clock.dateIst,
    timeIst: clock.timeIst,
    shouldAutoRefresh: shouldAutoRefresh(),
    serverTime: formatIstTimestamp(new Date()),
  });
}
