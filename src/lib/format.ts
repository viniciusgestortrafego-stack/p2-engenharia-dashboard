export function parseBRNumber(input: string | number | undefined | null): number {
  if (input === undefined || input === null) return 0;
  if (typeof input === "number") return input;
  const cleaned = input
    .replace(/R\$\s?/g, "")
    .replace(/%/g, "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

/** Parses a "DD/MM/YYYY" (or "DD/MM/YY") string into a Date, ignoring time. */
export function parseBRDate(input: string): Date | null {
  const match = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const year = y.length === 2 ? Number(y) + 2000 : Number(y);
  const date = new Date(year, Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a Date as "DD/MM" for chart axis labels. */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
