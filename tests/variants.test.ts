import { describe, expect, it } from "vitest";
import type { ProductVariant } from "@/domain/product";
import type { AvailabilityStatus } from "@/domain/enums";
import {
  defaultVariant,
  findVariant,
  hasAvailableVariant,
  highestPriceCents,
  lowestPriceCents,
  sortVariants,
  variantLabel,
} from "@/domain/variants";

function variant(
  overrides: Partial<ProductVariant> & { id: string; priceCents: number },
): ProductVariant {
  return {
    productId: "produto",
    sizeMl: null,
    label: null,
    compareAtPriceCents: null,
    availabilityStatus: "disponivel" as AvailabilityStatus,
    sortOrder: 0,
    ...overrides,
  };
}

describe("sortVariants", () => {
  it("ordena por sortOrder e, em empate, pelo volume", () => {
    const ordered = sortVariants([
      variant({ id: "c", priceCents: 100, sortOrder: 1 }),
      variant({ id: "a", priceCents: 100, sortOrder: 0, sizeMl: 100 }),
      variant({ id: "b", priceCents: 100, sortOrder: 0, sizeMl: 30 }),
    ]);

    expect(ordered.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("não altera o array original", () => {
    const input = [
      variant({ id: "b", priceCents: 100, sortOrder: 1 }),
      variant({ id: "a", priceCents: 100, sortOrder: 0 }),
    ];
    sortVariants(input);
    expect(input[0]?.id).toBe("b");
  });
});

describe("variantLabel", () => {
  it("usa o volume em ml quando não há rótulo", () => {
    expect(variantLabel(variant({ id: "a", priceCents: 1, sizeMl: 50 }))).toBe("50 ml");
  });

  it("prefere o rótulo próprio", () => {
    expect(variantLabel(variant({ id: "a", priceCents: 1, sizeMl: 50, label: "Kit 2 peças" }))).toBe(
      "Kit 2 peças",
    );
  });

  it("ignora rótulo em branco", () => {
    expect(variantLabel(variant({ id: "a", priceCents: 1, sizeMl: 30, label: "   " }))).toBe("30 ml");
  });

  it("cai para volume único quando não há volume nem rótulo", () => {
    expect(variantLabel(variant({ id: "a", priceCents: 1 }))).toBe("Volume único");
  });
});

describe("defaultVariant", () => {
  it("escolhe a primeira variante que pode ser solicitada", () => {
    const chosen = defaultVariant([
      variant({ id: "esgotada", priceCents: 100, sortOrder: 0, availabilityStatus: "esgotado" }),
      variant({ id: "disponivel", priceCents: 200, sortOrder: 1 }),
    ]);

    expect(chosen?.id).toBe("disponivel");
  });

  it("aceita variantes por encomenda e últimas unidades", () => {
    const chosen = defaultVariant([
      variant({ id: "encomenda", priceCents: 100, availabilityStatus: "sob_encomenda" }),
    ]);

    expect(chosen?.id).toBe("encomenda");
  });

  it("devolve a primeira quando todas estão esgotadas, para manter o preço visível", () => {
    const chosen = defaultVariant([
      variant({ id: "a", priceCents: 100, sortOrder: 0, availabilityStatus: "esgotado" }),
      variant({ id: "b", priceCents: 200, sortOrder: 1, availabilityStatus: "esgotado" }),
    ]);

    expect(chosen?.id).toBe("a");
  });

  it("devolve null sem variantes", () => {
    expect(defaultVariant([])).toBeNull();
  });
});

describe("preços e disponibilidade", () => {
  const variants = [
    variant({ id: "a", priceCents: 19990 }),
    variant({ id: "b", priceCents: 42990 }),
    variant({ id: "c", priceCents: 28990 }),
  ];

  it("encontra o menor e o maior preço", () => {
    expect(lowestPriceCents(variants)).toBe(19990);
    expect(highestPriceCents(variants)).toBe(42990);
  });

  it("devolve null quando não há variantes", () => {
    expect(lowestPriceCents([])).toBeNull();
    expect(highestPriceCents([])).toBeNull();
  });

  it("considera o produto indisponível apenas se tudo estiver esgotado", () => {
    expect(hasAvailableVariant(variants)).toBe(true);
    expect(
      hasAvailableVariant([
        variant({ id: "a", priceCents: 1, availabilityStatus: "esgotado" }),
        variant({ id: "b", priceCents: 2, availabilityStatus: "esgotado" }),
      ]),
    ).toBe(false);
    expect(hasAvailableVariant([])).toBe(false);
  });
});

describe("findVariant", () => {
  it("localiza pelo id e devolve null quando não existe", () => {
    const list = [variant({ id: "a", priceCents: 1 })];
    expect(findVariant(list, "a")?.id).toBe("a");
    expect(findVariant(list, "z")).toBeNull();
  });
});
