import { isPurchasable } from "./enums";
import type { Product, ProductVariant } from "./product";

/**
 * Promoções.
 *
 * Uma promoção tem duas partes, e as duas precisam ser verdade:
 *
 *   1. **o preço** — a variante tem `compareAtPriceCents` maior que o preço
 *      atual. É daí que sai o percentual, sempre calculado, nunca digitado;
 *   2. **a janela** — o produto pode ter início e/ou fim de oferta. Fora da
 *      janela, o desconto simplesmente não existe para o site.
 *
 * Variantes esgotadas ficam de fora: anunciar desconto no que não pode ser
 * pedido seria enganoso.
 */

export interface Discount {
  variantId: string;
  priceCents: number;
  compareAtPriceCents: number;
  /** Percentual de desconto, arredondado. 289,90 sobre 429,90 → 33. */
  percentOff: number;
  savedCents: number;
}

export type OfferWindow = { startsAt: string | null; endsAt: string | null };

function toTime(value: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** A janela está aberta agora? Datas ausentes ou inválidas não restringem. */
export function isOfferWindowOpen(window: OfferWindow, now: Date = new Date()): boolean {
  const current = now.getTime();
  const startsAt = toTime(window.startsAt);
  const endsAt = toTime(window.endsAt);

  if (startsAt !== null && current < startsAt) return false;
  if (endsAt !== null && current >= endsAt) return false;
  return true;
}

/** Desconto da variante, ignorando a janela — a janela é do produto. */
export function variantDiscount(variant: ProductVariant): Discount | null {
  const compare = variant.compareAtPriceCents;
  if (compare === null || compare <= variant.priceCents) return null;
  if (!isPurchasable(variant.availabilityStatus)) return null;

  const savedCents = compare - variant.priceCents;

  return {
    variantId: variant.id,
    priceCents: variant.priceCents,
    compareAtPriceCents: compare,
    percentOff: Math.round((savedCents / compare) * 100),
    savedCents,
  };
}

/**
 * Maior desconto ativo do produto — é ele que vira selo e ordena a vitrine.
 * Devolve `null` fora da janela de oferta.
 */
export function bestDiscount(product: Product, now: Date = new Date()): Discount | null {
  if (!isOfferWindowOpen({ startsAt: product.offerStartsAt, endsAt: product.offerEndsAt }, now)) {
    return null;
  }

  return product.variants.reduce<Discount | null>((best, variant) => {
    const discount = variantDiscount(variant);
    if (!discount) return best;
    if (!best || discount.percentOff > best.percentOff) return discount;
    return best;
  }, null);
}

export function hasPromotion(product: Product, now: Date = new Date()): boolean {
  return bestDiscount(product, now) !== null;
}

/**
 * O produto tem preço promocional cadastrado, mesmo que a janela ainda não
 * tenha aberto ou já tenha fechado. Usado no painel, para a loja enxergar
 * ofertas agendadas e encerradas.
 */
export function hasDiscountPrice(product: Product): boolean {
  return product.variants.some((variant) => variantDiscount(variant) !== null);
}

export type OfferStatus = "sem_oferta" | "agendada" | "ativa" | "encerrada";

/** Em que ponto da vida a oferta está — o rótulo do painel sai daqui. */
export function offerStatus(product: Product, now: Date = new Date()): OfferStatus {
  if (!hasDiscountPrice(product)) return "sem_oferta";

  const current = now.getTime();
  const startsAt = toTime(product.offerStartsAt);
  const endsAt = toTime(product.offerEndsAt);

  if (startsAt !== null && current < startsAt) return "agendada";
  if (endsAt !== null && current >= endsAt) return "encerrada";
  return "ativa";
}

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  sem_oferta: "Sem oferta",
  agendada: "Agendada",
  ativa: "Ativa",
  encerrada: "Encerrada",
};

/** Milissegundos até a oferta fechar. `null` quando não há prazo. */
export function offerTimeRemaining(product: Product, now: Date = new Date()): number | null {
  const endsAt = toTime(product.offerEndsAt);
  if (endsAt === null) return null;
  return Math.max(0, endsAt - now.getTime());
}

/** Quebra a contagem em dias, horas e minutos para exibição. */
export function splitDuration(milliseconds: number): {
  days: number;
  hours: number;
  minutes: number;
} {
  const totalMinutes = Math.floor(milliseconds / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

/** Texto curto da contagem: "2 dias", "5 h 20 min", "faltam minutos". */
export function formatTimeRemaining(milliseconds: number): string {
  const { days, hours, minutes } = splitDuration(milliseconds);
  if (days > 0) return days === 1 ? "resta 1 dia" : `restam ${days} dias`;
  if (hours > 0) return `restam ${hours} h ${minutes.toString().padStart(2, "0")} min`;
  if (minutes > 0) return minutes === 1 ? "resta 1 minuto" : `restam ${minutes} minutos`;
  return "termina agora";
}

/** Produtos em promoção ativa, do maior para o menor desconto. */
export function promotionalProducts(
  products: readonly Product[],
  now: Date = new Date(),
): Product[] {
  return products
    .map((product) => ({ product, discount: bestDiscount(product, now) }))
    .filter((entry): entry is { product: Product; discount: Discount } => entry.discount !== null)
    .sort((a, b) => b.discount.percentOff - a.discount.percentOff)
    .map((entry) => entry.product);
}

/** Maior desconto ativo do catálogo, usado na barra promocional do topo. */
export function highestPercentOff(
  products: readonly Product[],
  now: Date = new Date(),
): number | null {
  const percentages = products
    .map((product) => bestDiscount(product, now)?.percentOff ?? null)
    .filter((value): value is number => value !== null);

  return percentages.length > 0 ? Math.max(...percentages) : null;
}
