"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Product } from "@/domain/product";
import type { Concentration, FragranceFamily, Gender, SortOption } from "@/domain/enums";
import {
  EMPTY_FILTERS,
  applyCatalogFilters,
  collectBrands,
  countActiveFilters,
  priceBounds,
  toggleQuickFilter,
  type CatalogFilters,
  type QuickFilter,
} from "@/domain/catalog";
import { highestPercentOff, promotionalProducts } from "@/domain/promotions";
import { siteConfig } from "@/lib/site-config";

const PRODUCT_QUERY_PARAM = "produto";

/**
 * Passo do relógio das ofertas. As contagens são exibidas em minutos, então
 * meio minuto de granularidade basta e evita re-render a cada segundo.
 */
const CLOCK_STEP_MS = 30_000;

function subscribeToClock(onChange: () => void) {
  const id = window.setInterval(onChange, CLOCK_STEP_MS);
  return () => window.clearInterval(id);
}

function getClockSnapshot(): number {
  return Math.floor(Date.now() / CLOCK_STEP_MS) * CLOCK_STEP_MS;
}

type ArrayFilterKey = "genders" | "brands" | "families" | "concentrations";
type ArrayFilterValue = Gender | string | FragranceFamily | Concentration;

/**
 * Slug do produto presente na URL.
 *
 * Lido como uma fonte externa: durante a hidratação o React usa o instantâneo
 * do servidor (`null`), e só depois passa a considerar a URL real — assim um
 * link compartilhado abre o produto sem provocar divergência de hidratação.
 */
function subscribeToHistory(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getSlugFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get(PRODUCT_QUERY_PARAM);
}

interface CatalogApi {
  /** Todos os produtos ativos, na ordem vinda do servidor. */
  allProducts: Product[];
  /** Resultado após busca, filtros e ordenação. */
  results: Product[];
  /** Fatia visível — cresce com "Carregar mais". */
  visibleResults: Product[];
  hasMore: boolean;
  loadMore: () => void;

  /**
   * Instante corrente, com passo de meio minuto. Sai daqui — e não de
   * `new Date()` espalhado pelos componentes — para que toda a página concorde
   * sobre quais ofertas estão no ar.
   */
  now: Date;

  /** Produtos com desconto ativo agora, do maior para o menor desconto. */
  promotions: Product[];
  /** Maior percentual de desconto do catálogo, ou `null` se não houver. */
  maxPercentOff: number | null;

  filters: CatalogFilters;
  activeFilterCount: number;
  availableBrands: string[];
  bounds: { min: number; max: number } | null;
  /**
   * Muda sempre que os filtros são redefinidos de fora (limpar, atalhos de
   * universo ou de família). Serve de `key` para remontar os controles que
   * mantêm rascunho local, como os campos de preço.
   */
  resetToken: number;

  setQuery: (value: string) => void;
  toggleArrayFilter: (key: ArrayFilterKey, value: ArrayFilterValue) => void;
  setOnlyAvailable: (value: boolean) => void;
  setOnlyPromotions: (value: boolean) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSort: (sort: SortOption) => void;
  resetFilters: () => void;
  /** Alterna um recorte temático (promoções, novidades, mais vendidos…). */
  applyQuickFilter: (quick: QuickFilter) => void;

  /** Aplica um único gênero e leva o usuário até o catálogo. */
  focusGender: (gender: Gender) => void;
  /** Aplica uma única família olfativa e leva o usuário até o catálogo. */
  focusFamily: (family: FragranceFamily) => void;
  /** Mostra no catálogo apenas o que está em promoção. */
  focusPromotions: () => void;

  selectedProduct: Product | null;
  openProduct: (product: Product) => void;
  closeProduct: () => void;
}

const CatalogContext = createContext<CatalogApi | null>(null);

function scrollToCatalog() {
  const target = document.getElementById("catalogo");
  if (!target) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

export function CatalogProvider({
  products,
  renderedAt,
  children,
}: {
  products: Product[];
  /**
   * Instante em que o servidor montou a página. Serve de instantâneo durante a
   * hidratação: cliente e servidor concordam no primeiro render e o relógio só
   * passa a andar depois disso.
   */
  renderedAt: string;
  children: ReactNode;
}) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_FILTERS);
  const [pageCount, setPageCount] = useState(1);
  const [resetToken, setResetToken] = useState(0);

  // `undefined` significa "o usuário ainda não escolheu": nesse caso vale o que
  // estiver na URL. Depois de abrir ou fechar um produto, a escolha explícita
  // do usuário passa a mandar.
  const [selection, setSelection] = useState<Product | null | undefined>(undefined);

  const urlSlug = useSyncExternalStore(subscribeToHistory, getSlugFromUrl, () => null);

  const serverInstant = useMemo(() => {
    const parsed = Date.parse(renderedAt);
    return Number.isNaN(parsed) ? 0 : Math.floor(parsed / CLOCK_STEP_MS) * CLOCK_STEP_MS;
  }, [renderedAt]);

  const instant = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    () => serverInstant,
  );

  const now = useMemo(() => new Date(instant), [instant]);

  const selectedProduct =
    selection === undefined
      ? (products.find((product) => product.slug === urlSlug) ?? null)
      : selection;

  const results = useMemo(
    () => applyCatalogFilters(products, filters, now),
    [products, filters, now],
  );

  const visibleResults = useMemo(
    () => results.slice(0, pageCount * siteConfig.catalogPageSize),
    [results, pageCount],
  );

  const promotions = useMemo(() => promotionalProducts(products, now), [products, now]);
  const maxPercentOff = useMemo(() => highestPercentOff(products, now), [products, now]);
  const availableBrands = useMemo(() => collectBrands(products), [products]);
  const bounds = useMemo(() => priceBounds(products), [products]);
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  /* ---- Produto selecionado e link compartilhável ------------------------- */

  const replaceProductParam = useCallback((slug: string | null) => {
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set(PRODUCT_QUERY_PARAM, slug);
    } else {
      url.searchParams.delete(PRODUCT_QUERY_PARAM);
    }
    window.history.replaceState(null, "", url);
  }, []);

  const openProduct = useCallback(
    (product: Product) => {
      setSelection(product);
      replaceProductParam(product.slug);
    },
    [replaceProductParam],
  );

  const closeProduct = useCallback(() => {
    setSelection(null);
    replaceProductParam(null);
  }, [replaceProductParam]);

  /* ---- Ações de filtro --------------------------------------------------- */

  /** Toda mudança de filtro recomeça a paginação. */
  const updateFilters = useCallback(
    (update: (current: CatalogFilters) => CatalogFilters) => {
      setFilters(update);
      setPageCount(1);
    },
    [],
  );

  const setQuery = useCallback(
    (query: string) => updateFilters((current) => ({ ...current, query })),
    [updateFilters],
  );

  const toggleArrayFilter = useCallback(
    (key: ArrayFilterKey, value: ArrayFilterValue) => {
      updateFilters((current) => {
        const list = current[key] as string[];
        const next = list.includes(value as string)
          ? list.filter((item) => item !== value)
          : [...list, value as string];
        return { ...current, [key]: next } as CatalogFilters;
      });
    },
    [updateFilters],
  );

  const setOnlyAvailable = useCallback(
    (onlyAvailable: boolean) => updateFilters((current) => ({ ...current, onlyAvailable })),
    [updateFilters],
  );

  const setOnlyPromotions = useCallback(
    (onlyPromotions: boolean) => updateFilters((current) => ({ ...current, onlyPromotions })),
    [updateFilters],
  );

  const setPriceRange = useCallback(
    (minPriceCents: number | null, maxPriceCents: number | null) =>
      updateFilters((current) => ({ ...current, minPriceCents, maxPriceCents })),
    [updateFilters],
  );

  const setSort = useCallback(
    (sort: SortOption) => updateFilters((current) => ({ ...current, sort })),
    [updateFilters],
  );

  /** Substitui todos os filtros e força a remontagem dos controles locais. */
  const replaceFilters = useCallback(
    (next: CatalogFilters) => {
      updateFilters(() => next);
      setResetToken((token) => token + 1);
    },
    [updateFilters],
  );

  const resetFilters = useCallback(() => replaceFilters(EMPTY_FILTERS), [replaceFilters]);

  const applyQuickFilter = useCallback(
    (quick: QuickFilter) => updateFilters((current) => toggleQuickFilter(current, quick)),
    [updateFilters],
  );

  const focusGender = useCallback(
    (gender: Gender) => {
      replaceFilters({ ...EMPTY_FILTERS, genders: [gender] });
      scrollToCatalog();
    },
    [replaceFilters],
  );

  const focusFamily = useCallback(
    (family: FragranceFamily) => {
      replaceFilters({ ...EMPTY_FILTERS, families: [family] });
      scrollToCatalog();
    },
    [replaceFilters],
  );

  const focusPromotions = useCallback(() => {
    replaceFilters({ ...EMPTY_FILTERS, onlyPromotions: true });
    scrollToCatalog();
  }, [replaceFilters]);

  const loadMore = useCallback(() => setPageCount((current) => current + 1), []);

  const api = useMemo<CatalogApi>(
    () => ({
      allProducts: products,
      results,
      visibleResults,
      hasMore: visibleResults.length < results.length,
      loadMore,
      now,
      promotions,
      maxPercentOff,
      filters,
      activeFilterCount,
      availableBrands,
      bounds,
      resetToken,
      setQuery,
      toggleArrayFilter,
      setOnlyAvailable,
      setOnlyPromotions,
      setPriceRange,
      setSort,
      resetFilters,
      applyQuickFilter,
      focusGender,
      focusFamily,
      focusPromotions,
      selectedProduct,
      openProduct,
      closeProduct,
    }),
    [
      products,
      results,
      visibleResults,
      loadMore,
      now,
      promotions,
      maxPercentOff,
      filters,
      activeFilterCount,
      availableBrands,
      bounds,
      resetToken,
      setQuery,
      toggleArrayFilter,
      setOnlyAvailable,
      setOnlyPromotions,
      setPriceRange,
      setSort,
      resetFilters,
      applyQuickFilter,
      focusGender,
      focusFamily,
      focusPromotions,
      selectedProduct,
      openProduct,
      closeProduct,
    ],
  );

  return <CatalogContext.Provider value={api}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogApi {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog precisa estar dentro de <CatalogProvider>.");
  }
  return context;
}
