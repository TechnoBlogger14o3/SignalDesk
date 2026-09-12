import { formatIstTimestamp } from "@/lib/market-hours";
import { formatInr } from "@/lib/format";

export function ErrorPanel({
  lastPrice,
  lastUpdate,
  onRetry,
}: {
  lastPrice?: number | null;
  lastUpdate?: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="error-panel" role="status">
      <p>Market data temporarily unavailable.</p>
      {lastPrice ? (
        <p>
          Last available price: <strong>{formatInr(lastPrice)}</strong>
        </p>
      ) : null}
      {lastUpdate ? <p>Last successful update: {formatIstTimestamp(lastUpdate)}</p> : null}
      <button type="button" className="btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
