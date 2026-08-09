import { describe, expect, it } from "vitest";
import type { Product } from "@/domain/product";
import {
  EMPTY_FILTERS,
  applyCatalogFilters,
  collectBrands,
  countActiveFilters,
  filterProducts,
  normalizeSearchTerm,
  priceBounds,
  sortProducts,
  toggleQuickFilter,
  isQuickFilterActive,
  type CatalogFilters,
} from "@/domain/catalog";
import { SEED_PRODUCTS } from "@/data/seed-products";

const products = SEED_PRODUCTS;

function withFilters(overrides: Partial<CatalogFilters>): CatalogFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

function names(list: Product[]): string[] {
  return list.map((product) => product.name);
}

describe("normalizeSearchTerm", () => {
  it("remove acentos e caixa", () => {
    expect(normalizeSearchTerm("  ÂMBAR Dourado ")).toBe("ambar dourado");
  });
});

describe("filterProducts — busca", () => {
  it("encontra por nome, ignorando caixa", () => {
    expect(names(filterProducts(products, withFilters({ query: "khamrah" })))).toEqual(["Khamrah"]);
  });

  it("encontra por marca", () => {
    const result = filterProducts(products, withFilters({ query: "lattafa" }));
    expect(result.length).toBeGreaterThan(1);
    expect(result.every((product) => product.brand === "Lattafa")).toBe(true);
  });

  it("exige que todos os termos apareçam", () => {
    expect(names(filterProducts(products, withFilters({ query: "lattafa asad" })))).toEqual(["Asad"]);
    expect(filterProducts(products, withFilters({ query: "lattafa afnan" }))).toHaveLength(0);
  });

  it("devolve tudo com busca vazia", () => {
    expect(filterProducts(products, EMPTY_FILTERS)).toHaveLength(products.length);
  });
});

describe("filterProducts — filtros", () => {
  it("filtra por gênero", () => {
    const result = filterProducts(products, withFilters({ genders: ["feminino"] }));
    expect(result.every((product) => product.gender === "feminino")).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("combina vários gêneros como união", () => {
    const result = filterProducts(products, withFilters({ genders: ["feminino", "unissex"] }));
    expect(result.every((product) => product.gender !== "masculino")).toBe(true);
  });

  it("filtra por família olfativa", () => {
    const result = filterProducts(products, withFilters({ families: ["oriental"] }));
    expect(result.every((product) => product.fragranceFamily === "oriental")).toBe(true);
  });

  it("filtra por concentração", () => {
    const result = filterProducts(products, withFilters({ concentrations: ["edt"] }));
    expect(result.every((product) => product.concentration === "edt")).toBe(true);
  });

  it("combina filtros de forma cumulativa", () => {
    const result = filterProducts(
      products,
      withFilters({ genders: ["masculino"], families: ["amadeirado"] }),
    );
    expect(
      result.every(
        (product) => product.gender === "masculino" && product.fragranceFamily === "amadeirado",
      ),
    ).toBe(true);
  });

  it("filtra por faixa de preço considerando qualquer variante", () => {
    const result = filterProducts(products, withFilters({ minPriceCents: 0, maxPriceCents: 20000 }));
    expect(
      result.every((product) =>
        product.variants.some((variant) => variant.priceCents <= 20000),
      ),
    ).toBe(true);
    expect(names(result)).toContain("Khamrah"); // tem a versão de 30 ml
  });

  it("oculta produtos totalmente esgotados quando pedido", () => {
    const esgotado: Product = {
      ...products[0]!,
      id: "esgotado",
      name: "Totalmente esgotado",
      slug: "totalmente-esgotado",
      variants: products[0]!.variants.map((variant) => ({
        ...variant,
        availabilityStatus: "esgotado" as const,
      })),
    };

    const pool = [...products, esgotado];
    expect(names(filterProducts(pool, withFilters({ onlyAvailable: false })))).toContain(
      "Totalmente esgotado",
    );
    expect(names(filterProducts(pool, withFilters({ onlyAvailable: true })))).not.toContain(
      "Totalmente esgotado",
    );
  });
});

describe("sortProducts", () => {
  it("coloca os destaques primeiro na ordenação padrão", () => {
    const sorted = sortProducts(products, "destaque");
    const firstNonFeatured = sorted.findIndex((product) => !product.isFeatured);
    const lastFeatured = sorted.map((product) => product.isFeatured).lastIndexOf(true);
    expect(lastFeatured).toBeLessThan(firstNonFeatured);
  });

  it("ordena do menor para o maior preço", () => {
    const sorted = sortProducts(products, "menor_preco");
    const prices = sorted.map((product) =>
      Math.min(...product.variants.map((variant) => variant.priceCents)),
    );
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("ordena do maior para o menor preço", () => {
    const sorted = sortProducts(products, "maior_preco");
    const prices = sorted.map((product) =>
      Math.min(...product.variants.map((variant) => variant.priceCents)),
    );
    expect([...prices].sort((a, b) => b - a)).toEqual(prices);
  });

  it("ordena lançamentos pelos mais recentes", () => {
    const sorted = sortProducts(products, "lancamentos");
    const dates = sorted.map((product) => new Date(product.createdAt).getTime());
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it("não modifica o array recebido", () => {
    const original = names(products);
    sortProducts(products, "maior_preco");
    expect(names(products)).toEqual(original);
  });
});

describe("applyCatalogFilters", () => {
  it("aplica filtro e ordenação juntos", () => {
    const result = applyCatalogFilters(
      products,
      withFilters({ genders: ["masculino"], sort: "menor_preco" }),
    );
    const prices = result.map((product) =>
      Math.min(...product.variants.map((variant) => variant.priceCents)),
    );
    expect(result.every((product) => product.gender === "masculino")).toBe(true);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("devolve lista vazia quando nada corresponde", () => {
    expect(
      applyCatalogFilters(products, withFilters({ query: "inexistente-xyz" })),
    ).toHaveLength(0);
  });
});

describe("countActiveFilters", () => {
  it("conta cada critério aplicado", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(
      countActiveFilters(
        withFilters({
          query: "oud",
          genders: ["unissex"],
          families: ["oriental", "amadeirado"],
          onlyAvailable: true,
          minPriceCents: 10000,
        }),
      ),
    ).toBe(6);
  });

  it("ignora espaços em branco na busca", () => {
    expect(countActiveFilters(withFilters({ query: "   " }))).toBe(0);
  });
});

describe("auxiliares do catálogo", () => {
  it("lista as marcas em ordem alfabética e sem repetição", () => {
    const brands = collectBrands(products);
    expect(brands).toEqual([...new Set(brands)]);
    expect([...brands].sort((a, b) => a.localeCompare(b, "pt-BR"))).toEqual(brands);
  });

  it("calcula a faixa de preço do catálogo", () => {
    const bounds = priceBounds(products);
    expect(bounds).not.toBeNull();
    expect(bounds!.min).toBeLessThan(bounds!.max);
  });

  it("devolve null sem produtos", () => {
    expect(priceBounds([])).toBeNull();
  });
});

describe("filtros de promoção e selo", () => {
  it("onlyPromotions mostra só o que tem desconto real", () => {
    const result = filterProducts(products, withFilters({ onlyPromotions: true }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(products.length);
    expect(
      result.every((product) =>
        product.variants.some(
          (variant) =>
            variant.compareAtPriceCents !== null &&
            variant.compareAtPriceCents > variant.priceCents,
        ),
      ),
    ).toBe(true);
  });

  it("filtra por selo", () => {
    const result = filterProducts(products, withFilters({ badges: ["mais_vendido"] }));
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((product) => product.badge === "mais_vendido")).toBe(true);
  });

  it("combina selo e promoção de forma cumulativa", () => {
    const result = filterProducts(
      products,
      withFilters({ badges: ["lancamento"], onlyPromotions: true }),
    );
    expect(result.every((product) => product.badge === "lancamento")).toBe(true);
  });
});

describe("atalhos temáticos", () => {
  it("liga e desliga promoções", () => {
    const ligado = toggleQuickFilter(EMPTY_FILTERS, "promocoes");
    expect(ligado.onlyPromotions).toBe(true);
    expect(isQuickFilterActive(ligado, "promocoes")).toBe(true);

    const desligado = toggleQuickFilter(ligado, "promocoes");
    expect(desligado.onlyPromotions).toBe(false);
    expect(isQuickFilterActive(desligado, "promocoes")).toBe(false);
  });

  it("novidades e mais vendidos alternam o selo correspondente", () => {
    const novidades = toggleQuickFilter(EMPTY_FILTERS, "novidades");
    expect(novidades.badges).toContain("lancamento");

    const ambos = toggleQuickFilter(novidades, "mais_vendidos");
    expect(ambos.badges).toEqual(["lancamento", "mais_vendido"]);

    const semNovidades = toggleQuickFilter(ambos, "novidades");
    expect(semNovidades.badges).toEqual(["mais_vendido"]);
  });

  it("disponíveis reaproveita o filtro de disponibilidade", () => {
    const ligado = toggleQuickFilter(EMPTY_FILTERS, "disponiveis");
    expect(ligado.onlyAvailable).toBe(true);
    expect(isQuickFilterActive(ligado, "disponiveis")).toBe(true);
  });

  it("conta os atalhos no total de filtros ativos", () => {
    const filtros = toggleQuickFilter(
      toggleQuickFilter(EMPTY_FILTERS, "promocoes"),
      "novidades",
    );
    expect(countActiveFilters(filtros)).toBe(2);
  });
});
