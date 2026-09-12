export function formatInr(value?: number | null, digits?: number): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  const maximumFractionDigits = digits ?? (Math.abs(value) >= 100 ? 2 : 2);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits: maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value?: number | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value?: number | null, digits = 0): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatScore(value?: number | null): string {
  if (value === undefined || value === null) return "n/a";
  return `${Math.round(value)}/100`;
}

export function formatVolume(value?: number | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return `${(value / 10_000_000).toFixed(2)} Cr`;
  if (abs >= 100_000) return `${(value / 100_000).toFixed(2)} L`;
  return formatNumber(value, 0);
}
