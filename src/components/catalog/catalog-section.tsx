"use client";

import { useState, useTransition } from "react";
import { SORT_LABELS, SORT_OPTIONS, isSortOption } from "@/domain/enums";
import {
  QUICK_FILTERS,
  QUICK_FILTER_LABELS,
  isQuickFilterActive,
  type QuickFilter,
} from "@/domain/catalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton } from "@/components/ui/dialog";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { SearchGlyph } from "@/components/icons";
import { SectionHeading } from "@/components/site/section-heading";
import { useCatalog } from "./catalog-provider";
import { FiltersPanel } from "./filters-panel";
import { ProductCard } from "./product-card";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";
import { cn } from "@/lib/cn";

function EmptyState({ onReset }: { onReset: () => void }) {
  const { requestWhatsapp } = useWhatsapp();

  return (
    <div className="col-span-full flex flex-col items-center border border-line bg-surface-raised px-6 py-16 text-center">
      <span aria-hidden="true" className="hairline max-w-24" />
      <h3 className="mt-6 font-display text-2xl text-ink">Nenhum perfume com esses critérios</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        O acervo muda com frequência e nem tudo que temos em loja está publicado aqui. Ajuste os
        filtros ou conte para uma consultora o que você procura.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={onReset}>
          Limpar filtros
        </Button>
        <Button variant="whatsapp" onClick={() => requestWhatsapp({ source: "catalog_empty" })}>
          Pedir ajuda no WhatsApp
        </Button>
      </div>
    </div>
  );
}

export function CatalogSection({ showDemoNotice = false }: { showDemoNotice?: boolean }) {
  const {
    results,
    visibleResults,
    hasMore,
    loadMore,
    filters,
    activeFilterCount,
    resetToken,
    promotions,
    setQuery,
    setSort,
    resetFilters,
    applyQuickFilter,
  } = useCatalog();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleQueryChange = (value: string) => {
    // A filtragem entra como transição: em catálogos grandes a digitação
    // continua fluida e o grid exibe o esqueleto enquanto recalcula.
    startTransition(() => setQuery(value));
  };

  return (
    <section id="catalogo" aria-labelledby="catalogo-title" className="shell scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        id="catalogo-title"
        eyebrow="Catálogo"
        title="Todas as fragrâncias"
        description="Pesquise por nome ou marca, refine por perfil e leve suas escolhas para a conversa no WhatsApp."
      />

      {showDemoNotice ? (
        <p
          role="note"
          className="mt-8 border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-ink-muted"
        >
          Catálogo de demonstração. Preços, volumes e disponibilidade são exemplos e precisam ser
          conferidos — conecte o Supabase e cadastre o acervo pelo painel administrativo.
        </p>
      ) : null}

      {/* Atalhos temáticos — recortes rápidos antes dos filtros detalhados. */}
      <ul className="mt-10 flex flex-wrap gap-2">
        {QUICK_FILTERS.filter(
          (quick: QuickFilter) => quick !== "promocoes" || promotions.length > 0,
        ).map((quick: QuickFilter) => {
          const active = isQuickFilterActive(filters, quick);
          return (
            <li key={quick}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => applyQuickFilter(quick)}
                className={cn(
                  "inline-flex min-h-11 items-center border px-4 py-2 text-xs tracking-wide transition-colors duration-300",
                  active
                    ? "border-ink bg-ink text-ink-inverse"
                    : "border-line text-ink-muted hover:border-gold-deep hover:text-ink",
                )}
              >
                {QUICK_FILTER_LABELS[quick]}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        {/* Filtros — coluna fixa no desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="eyebrow">Filtros</h3>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-ink-muted underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Limpar
                </button>
              ) : null}
            </div>
            <FiltersPanel key={resetToken} />
          </div>
        </aside>

        <div>
          {/* Busca e ordenação */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchGlyph className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint" />
              <label htmlFor="catalogo-busca" className="sr-only">
                Pesquisar por nome ou marca
              </label>
              <input
                id="catalogo-busca"
                key={resetToken}
                type="search"
                defaultValue={filters.query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="Pesquisar por nome ou marca"
                className="min-h-12 w-full border border-line bg-surface-raised py-2 pr-4 pl-10 text-sm text-ink placeholder:text-ink-faint focus:border-gold-deep"
              />
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="catalogo-ordenacao" className="sr-only">
                Ordenar por
              </label>
              <select
                id="catalogo-ordenacao"
                value={filters.sort}
                onChange={(event) => {
                  const value = event.target.value;
                  if (isSortOption(value)) setSort(value);
                }}
                className="min-h-12 flex-1 appearance-none border border-line bg-surface-raised px-4 py-2 text-sm text-ink focus:border-gold-deep sm:flex-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-surface-raised text-ink">
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>

              <Button
                variant="quiet"
                size="sm"
                className="lg:hidden"
                onClick={() => setFiltersOpen(true)}
              >
                Filtros
                {activeFilterCount > 0 ? (
                  <span className="ml-1 inline-flex size-5 items-center justify-center bg-ink text-[0.625rem] text-ink-inverse">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </div>
          </div>

          {/* Resumo dos resultados */}
          <div className="mt-5 flex items-center justify-between gap-4 border-b border-line pb-4">
            <p aria-live="polite" className="text-xs tracking-wide text-ink-muted">
              {results.length === 0
                ? "Nenhum resultado"
                : `${results.length} ${results.length === 1 ? "perfume" : "perfumes"}`}
            </p>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-ink-muted underline underline-offset-4 transition-colors hover:text-ink lg:hidden"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>

          {/* Grade */}
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
            {isPending ? (
              Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)
            ) : results.length === 0 ? (
              <EmptyState onReset={resetFilters} />
            ) : (
              visibleResults.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 3} />
              ))
            )}
          </div>

          {hasMore && !isPending ? (
            <div className="mt-14 flex justify-center">
              <Button variant="outline" size="lg" onClick={loadMore}>
                Carregar mais
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Filtros em drawer no mobile */}
      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros do catálogo"
        placement="right"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-xl text-ink">Filtros</h3>
          <DialogCloseButton onClose={() => setFiltersOpen(false)} label="Fechar filtros" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <FiltersPanel key={resetToken} />
        </div>

        <div className="flex gap-3 border-t border-line px-5 py-4">
          <Button variant="ghost" className="flex-1" onClick={resetFilters}>
            Limpar
          </Button>
          <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
            Ver {results.length} {results.length === 1 ? "perfume" : "perfumes"}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
