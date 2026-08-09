import type { Badge, Concentration, FragranceFamily, Gender, SortOption } from "./enums";
import type { Product } from "./product";
import { hasPromotion } from "./promotions";
import { hasAvailableVariant, lowestPriceCents } from "./variants";

export interface CatalogFilters {
  query: string;
  genders: Gender[];
  brands: string[];
  families: FragranceFamily[];
  concentrations: Concentration[];
  badges: Badge[];
  /** Oculta produtos cujas variantes estão todas esgotadas. */
  onlyAvailable: boolean;
  /** Mostra apenas produtos com preço anterior maior que o atual. */
  onlyPromotions: boolean;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  sort: SortOption;
}

export const EMPTY_FILTERS: CatalogFilters = {
  query: "",
  genders: [],
  brands: [],
  families: [],
  concentrations: [],
  badges: [],
  onlyAvailable: false,
  onlyPromotions: false,
  minPriceCents: null,
  maxPriceCents: null,
  sort: "destaque",
};

/** Remove acentos e caixa para que "atesse" encontre "Attesse". */
export function normalizeSearchTerm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesQuery(product: Product, query: string): boolean {
  const normalized = normalizeSearchTerm(query);
  if (normalized === "") return true;
  const terms = normalized.split(/\s+/);
  const haystack = normalizeSearchTerm(`${product.name} ${product.brand}`);
  return terms.every((term) => haystack.includes(term));
}

function matchesPriceRange(product: Product, min: number | null, max: number | null): boolean {
  if (min === null && max === null) return true;
  return product.variants.some((variant) => {
    if (min !== null && variant.priceCents < min) return false;
    if (max !== null && variant.priceCents > max) return false;
    return true;
  });
}

export function filterProducts(
  products: readonly Product[],
  filters: CatalogFilters,
  now: Date = new Date(),
): Product[] {
  return products.filter((product) => {
    if (!matchesQuery(product, filters.query)) return false;
    if (filters.genders.length > 0 && !filters.genders.includes(product.gender)) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) return false;
    if (
      filters.families.length > 0 &&
      (product.fragranceFamily === null || !filters.families.includes(product.fragranceFamily))
    ) {
      return false;
    }
    if (
      filters.concentrations.length > 0 &&
      (product.concentration === null || !filters.concentrations.includes(product.concentration))
    ) {
      return false;
    }
    if (
      filters.badges.length > 0 &&
      (product.badge === null || !filters.badges.includes(product.badge))
    ) {
      return false;
    }
    if (filters.onlyAvailable && !hasAvailableVariant(product.variants)) return false;
    if (filters.onlyPromotions && !hasPromotion(product, now)) return false;
    if (!matchesPriceRange(product, filters.minPriceCents, filters.maxPriceCents)) return false;
    return true;
  });
}

/** Produtos sem preço cadastrado vão para o fim das ordenações por preço. */
function comparePrice(a: Product, b: Product, direction: 1 | -1): number {
  const priceA = lowestPriceCents(a.variants);
  const priceB = lowestPriceCents(b.variants);
  if (priceA === null && priceB === null) return 0;
  if (priceA === null) return 1;
  if (priceB === null) return -1;
  return (priceA - priceB) * direction;
}

export function sortProducts(products: readonly Product[], sort: SortOption): Product[] {
  const sorted = [...products];

  switch (sort) {
    case "menor_preco":
      sorted.sort((a, b) => comparePrice(a, b, 1) || a.name.localeCompare(b.name, "pt-BR"));
      break;
    case "maior_preco":
      sorted.sort((a, b) => comparePrice(a, b, -1) || a.name.localeCompare(b.name, "pt-BR"));
      break;
    case "lancamentos":
      sorted.sort((a, b) => {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return diff || a.name.localeCompare(b.name, "pt-BR");
      });
      break;
    case "destaque":
    default:
      sorted.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name, "pt-BR");
      });
      break;
  }

  return sorted;
}

export function applyCatalogFilters(
  products: readonly Product[],
  filters: CatalogFilters,
  now: Date = new Date(),
): Product[] {
  return sortProducts(filterProducts(products, filters, now), filters.sort);
}

/** Quantos filtros o usuário aplicou — usado no badge do botão "Filtros". */
export function countActiveFilters(filters: CatalogFilters): number {
  let count = 0;
  if (filters.query.trim() !== "") count += 1;
  count += filters.genders.length;
  count += filters.brands.length;
  count += filters.families.length;
  count += filters.concentrations.length;
  count += filters.badges.length;
  if (filters.onlyAvailable) count += 1;
  if (filters.onlyPromotions) count += 1;
  if (filters.minPriceCents !== null || filters.maxPriceCents !== null) count += 1;
  return count;
}

/* -------------------------------------------------------------------------- */
/* Atalhos temáticos                                                          */
/* -------------------------------------------------------------------------- */

export const QUICK_FILTERS = ["promocoes", "novidades", "mais_vendidos", "disponiveis"] as const;
export type QuickFilter = (typeof QUICK_FILTERS)[number];

export const QUICK_FILTER_LABELS: Record<QuickFilter, string> = {
  promocoes: "Promoções",
  novidades: "Novidades",
  mais_vendidos: "Mais vendidos",
  disponiveis: "Disponíveis agora",
};

/** Aplica um atalho sobre os filtros atuais, alternando quando já está ativo. */
export function toggleQuickFilter(
  filters: CatalogFilters,
  quick: QuickFilter,
): CatalogFilters {
  switch (quick) {
    case "promocoes":
      return { ...filters, onlyPromotions: !filters.onlyPromotions };
    case "disponiveis":
      return { ...filters, onlyAvailable: !filters.onlyAvailable };
    case "novidades":
      return {
        ...filters,
        badges: filters.badges.includes("lancamento")
          ? filters.badges.filter((badge) => badge !== "lancamento")
          : [...filters.badges, "lancamento"],
      };
    case "mais_vendidos":
      return {
        ...filters,
        badges: filters.badges.includes("mais_vendido")
          ? filters.badges.filter((badge) => badge !== "mais_vendido")
          : [...filters.badges, "mais_vendido"],
      };
    default:
      return filters;
  }
}

export function isQuickFilterActive(filters: CatalogFilters, quick: QuickFilter): boolean {
  switch (quick) {
    case "promocoes":
      return filters.onlyPromotions;
    case "disponiveis":
      return filters.onlyAvailable;
    case "novidades":
      return filters.badges.includes("lancamento");
    case "mais_vendidos":
      return filters.badges.includes("mais_vendido");
    default:
      return false;
  }
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return countActiveFilters(filters) > 0 || filters.sort !== EMPTY_FILTERS.sort;
}

/** Marcas presentes no catálogo, em ordem alfabética. */
export function collectBrands(products: readonly Product[]): string[] {
  const brands = new Set<string>();
  for (const product of products) {
    if (product.brand.trim() !== "") brands.add(product.brand);
  }
  return [...brands].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Faixa de preço disponível no catálogo, em centavos. */
export function priceBounds(products: readonly Product[]): { min: number; max: number } | null {
  const prices = products.flatMap((product) => product.variants.map((variant) => variant.priceCents));
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
