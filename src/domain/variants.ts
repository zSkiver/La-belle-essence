import { isPurchasable } from "./enums";
import type { Product, ProductVariant } from "./product";

/** Ordena por `sortOrder` e, em empate, pelo volume crescente. */
export function sortVariants(variants: readonly ProductVariant[]): ProductVariant[] {
  return [...variants].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return (a.sizeMl ?? 0) - (b.sizeMl ?? 0);
  });
}

/** Rótulo exibido de uma variante: "50 ml", um rótulo próprio ou volume único. */
export function variantLabel(variant: ProductVariant): string {
  if (variant.label && variant.label.trim() !== "") return variant.label.trim();
  if (variant.sizeMl !== null) return `${variant.sizeMl} ml`;
  return "Volume único";
}

/**
 * Variante escolhida ao abrir o produto: a primeira que pode ser solicitada.
 * Se todas estiverem esgotadas, devolve a primeira para que o preço continue
 * visível — o botão de WhatsApp é desabilitado separadamente.
 */
export function defaultVariant(variants: readonly ProductVariant[]): ProductVariant | null {
  const ordered = sortVariants(variants);
  return ordered.find((variant) => isPurchasable(variant.availabilityStatus)) ?? ordered[0] ?? null;
}

export function findVariant(
  variants: readonly ProductVariant[],
  variantId: string,
): ProductVariant | null {
  return variants.find((variant) => variant.id === variantId) ?? null;
}

/** Menor preço entre as variantes, usado nos cards e na ordenação do catálogo. */
export function lowestPriceCents(variants: readonly ProductVariant[]): number | null {
  if (variants.length === 0) return null;
  return variants.reduce(
    (lowest, variant) => (lowest === null || variant.priceCents < lowest ? variant.priceCents : lowest),
    null as number | null,
  );
}

export function highestPriceCents(variants: readonly ProductVariant[]): number | null {
  if (variants.length === 0) return null;
  return variants.reduce(
    (highest, variant) =>
      highest === null || variant.priceCents > highest ? variant.priceCents : highest,
    null as number | null,
  );
}

/** Um produto está disponível se ao menos uma variante não está esgotada. */
export function hasAvailableVariant(variants: readonly ProductVariant[]): boolean {
  return variants.some((variant) => isPurchasable(variant.availabilityStatus));
}

export function coverImageUrl(product: Product): string | null {
  const cover = product.images.find((image) => image.isCover);
  if (cover) return cover.publicUrl;
  const first = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return first?.publicUrl ?? null;
}

export function orderedImages(product: Product) {
  return [...product.images].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
}
