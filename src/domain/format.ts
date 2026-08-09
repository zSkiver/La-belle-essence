import { siteConfig } from "@/lib/site-config";

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
});

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: siteConfig.timeZone,
});

const dateOnlyFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  dateStyle: "medium",
  timeZone: siteConfig.timeZone,
});

/** Converte centavos em moeda brasileira. 28990 → "R$ 289,90". */
export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

/** Preço com prefixo "a partir de" quando o produto tem mais de um volume. */
export function formatPriceFrom(cents: number, hasMultipleVariants: boolean): string {
  return hasMultipleVariants ? `A partir de ${formatPrice(cents)}` : formatPrice(cents);
}

/** Data e hora no fuso de São Paulo. */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateOnlyFormatter.format(date);
}

/** Converte "289,90" ou "R$ 289,90" em 28990. Retorna `null` se não for válido. */
export function parsePriceToCents(input: string): number | null {
  const cleaned = input
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  if (cleaned === "" || cleaned === "-") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** 28990 → "289,90" para preencher campos de formulário. */
export function centsToPriceInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}
