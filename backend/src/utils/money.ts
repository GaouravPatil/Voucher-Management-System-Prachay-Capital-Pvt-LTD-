export function toMoneyString(v: string | number): string {
  const n = typeof v === 'number' ? v : Number(v);
  return n.toFixed(2);
}
