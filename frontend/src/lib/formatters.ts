const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/** Format a decimal-string amount as INR. Never converts for math — display only. */
export function formatINR(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '₹0.00';
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return '₹0.00';
  return inrFormatter.format(n);
}

/** Format a YYYY-MM-DD date string. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d =
    /^\d{4}-\d{2}-\d{2}/.test(value) && value.length <= 10
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateFormatter.format(d);
}

/** Format an ISO timestamp. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateTimeFormatter.format(d);
}

/** Today's date as YYYY-MM-DD (local). */
export function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
