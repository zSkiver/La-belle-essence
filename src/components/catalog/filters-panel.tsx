"use client";

import { useState } from "react";
import {
  CONCENTRATIONS,
  CONCENTRATION_SHORT_LABELS,
  FRAGRANCE_FAMILIES,
  FRAGRANCE_FAMILY_LABELS,
  GENDERS,
  GENDER_LABELS,
} from "@/domain/enums";
import { centsToPriceInput, parsePriceToCents } from "@/domain/format";
import { useCatalog } from "./catalog-provider";
import { cn } from "@/lib/cn";

function FilterGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line pt-5 first:border-0 first:pt-0">
      <legend className="eyebrow mb-3">{legend}</legend>
      {children}
    </fieldset>
  );
}

/** Caixa de seleção apresentada como etiqueta — semântica de checkbox preservada. */
function ChipCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center border px-3.5 py-2 text-xs transition-colors",
        checked
          ? "border-gold-deep bg-gold-tint text-ink"
          : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {children}
    </label>
  );
}

export function FiltersPanel() {
  const {
    filters,
    availableBrands,
    bounds,
    toggleArrayFilter,
    setOnlyAvailable,
    setOnlyPromotions,
    setPriceRange,
  } = useCatalog();

  // Os campos de preço são controlados localmente para permitir digitação
  // livre; só viram filtro quando o valor é válido. Ao limpar os filtros o
  // componente é remontado pelo `resetToken`, então o rascunho some junto.
  const [minInput, setMinInput] = useState(centsToPriceInput(filters.minPriceCents));
  const [maxInput, setMaxInput] = useState(centsToPriceInput(filters.maxPriceCents));

  const commitPrice = (rawMin: string, rawMax: string) => {
    setPriceRange(
      rawMin.trim() === "" ? null : parsePriceToCents(rawMin),
      rawMax.trim() === "" ? null : parsePriceToCents(rawMax),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <FilterGroup legend="Gênero">
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((gender) => (
            <ChipCheckbox
              key={gender}
              checked={filters.genders.includes(gender)}
              onChange={() => toggleArrayFilter("genders", gender)}
            >
              {GENDER_LABELS[gender]}
            </ChipCheckbox>
          ))}
        </div>
      </FilterGroup>

      {availableBrands.length > 0 ? (
        <FilterGroup legend="Marca">
          <div className="flex flex-wrap gap-2">
            {availableBrands.map((brand) => (
              <ChipCheckbox
                key={brand}
                checked={filters.brands.includes(brand)}
                onChange={() => toggleArrayFilter("brands", brand)}
              >
                {brand}
              </ChipCheckbox>
            ))}
          </div>
        </FilterGroup>
      ) : null}

      <FilterGroup legend="Família olfativa">
        <div className="flex flex-wrap gap-2">
          {FRAGRANCE_FAMILIES.map((family) => (
            <ChipCheckbox
              key={family}
              checked={filters.families.includes(family)}
              onChange={() => toggleArrayFilter("families", family)}
            >
              {FRAGRANCE_FAMILY_LABELS[family]}
            </ChipCheckbox>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup legend="Concentração">
        <div className="flex flex-wrap gap-2">
          {CONCENTRATIONS.filter((value) => value !== "outra").map((concentration) => (
            <ChipCheckbox
              key={concentration}
              checked={filters.concentrations.includes(concentration)}
              onChange={() => toggleArrayFilter("concentrations", concentration)}
            >
              {CONCENTRATION_SHORT_LABELS[concentration]}
            </ChipCheckbox>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup legend="Disponibilidade">
        <div className="flex flex-col gap-1">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={filters.onlyAvailable}
              onChange={(event) => setOnlyAvailable(event.target.checked)}
              className="size-4 accent-gold-deep"
            />
            Mostrar apenas perfumes disponíveis
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={filters.onlyPromotions}
              onChange={(event) => setOnlyPromotions(event.target.checked)}
              className="size-4 accent-rose-deep"
            />
            Somente perfumes em promoção
          </label>
        </div>
      </FilterGroup>

      <FilterGroup legend="Faixa de preço">
        <div className="flex items-center gap-3">
          <label className="flex-1">
            <span className="sr-only">Preço mínimo em reais</span>
            <input
              type="text"
              inputMode="decimal"
              value={minInput}
              placeholder="Mínimo"
              onChange={(event) => setMinInput(event.target.value)}
              onBlur={() => commitPrice(minInput, maxInput)}
              className="min-h-11 w-full border border-line bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-gold-deep"
            />
          </label>
          <span aria-hidden="true" className="text-ink-faint">
            —
          </span>
          <label className="flex-1">
            <span className="sr-only">Preço máximo em reais</span>
            <input
              type="text"
              inputMode="decimal"
              value={maxInput}
              placeholder="Máximo"
              onChange={(event) => setMaxInput(event.target.value)}
              onBlur={() => commitPrice(minInput, maxInput)}
              className="min-h-11 w-full border border-line bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-gold-deep"
            />
          </label>
        </div>
        {bounds ? (
          <p className="mt-2 text-xs text-ink-faint">
            Catálogo entre {centsToPriceInput(bounds.min)} e {centsToPriceInput(bounds.max)} reais.
          </p>
        ) : null}
      </FilterGroup>
    </div>
  );
}
