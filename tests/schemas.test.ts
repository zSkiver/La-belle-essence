import { describe, expect, it } from "vitest";
import { productInputSchema, variantInputSchema, validateImageFile } from "@/domain/schemas";
import { slugify } from "@/lib/slug";

const validVariant = {
  sizeMl: 100,
  label: "",
  priceCents: 28990,
  compareAtPriceCents: null,
  availabilityStatus: "disponivel" as const,
  sortOrder: 0,
};

const validProduct = {
  name: "Khamrah",
  slug: "khamrah",
  brand: "Lattafa",
  shortDescription: "Especiarias quentes e baunilha.",
  description: "",
  gender: "unissex" as const,
  fragranceFamily: "gourmand" as const,
  concentration: "edp" as const,
  occasion: "",
  badge: "",
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
  notes: { top: ["Canela"], heart: [], base: [] },
  variants: [validVariant],
};

function issuePaths(input: unknown): string[] {
  const result = productInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("productInputSchema", () => {
  it("aceita um produto válido", () => {
    const result = productInputSchema.safeParse(validProduct);
    expect(result.success).toBe(true);
  });

  it("converte campos de texto vazios em null", () => {
    const result = productInputSchema.parse(validProduct);
    expect(result.description).toBeNull();
    expect(result.occasion).toBeNull();
    expect(result.badge).toBeNull();
  });

  it("exige nome com ao menos dois caracteres", () => {
    expect(issuePaths({ ...validProduct, name: "K" })).toContain("name");
  });

  it("exige marca", () => {
    expect(issuePaths({ ...validProduct, brand: "  " })).toContain("brand");
  });

  it("recusa slug com maiúsculas, espaços ou acentos", () => {
    expect(issuePaths({ ...validProduct, slug: "Khamrah" })).toContain("slug");
    expect(issuePaths({ ...validProduct, slug: "club de nuit" })).toContain("slug");
    expect(issuePaths({ ...validProduct, slug: "âmbar" })).toContain("slug");
  });

  it("aceita o slug produzido por slugify", () => {
    const slug = slugify("Club de Nuit Intense Man");
    expect(slug).toBe("club-de-nuit-intense-man");
    expect(productInputSchema.safeParse({ ...validProduct, slug }).success).toBe(true);
  });

  it("recusa gênero fora da lista", () => {
    expect(issuePaths({ ...validProduct, gender: "neutro" })).toContain("gender");
  });

  it("exige ao menos uma variante", () => {
    expect(issuePaths({ ...validProduct, variants: [] })).toContain("variants");
  });

  it("aponta o índice da variante com erro", () => {
    const paths = issuePaths({
      ...validProduct,
      variants: [validVariant, { ...validVariant, priceCents: 0 }],
    });
    expect(paths).toContain("variants.1.priceCents");
  });

  it("limita a descrição curta a 180 caracteres", () => {
    expect(issuePaths({ ...validProduct, shortDescription: "x".repeat(181) })).toContain(
      "shortDescription",
    );
  });
});

describe("variantInputSchema", () => {
  it("recusa preço zero ou negativo", () => {
    expect(variantInputSchema.safeParse({ ...validVariant, priceCents: 0 }).success).toBe(false);
    expect(variantInputSchema.safeParse({ ...validVariant, priceCents: -100 }).success).toBe(false);
  });

  it("exige volume em ml ou rótulo", () => {
    const result = variantInputSchema.safeParse({ ...validVariant, sizeMl: null, label: "" });
    expect(result.success).toBe(false);
  });

  it("aceita apenas rótulo, sem volume", () => {
    const result = variantInputSchema.safeParse({
      ...validVariant,
      sizeMl: null,
      label: "Kit com 2 peças",
    });
    expect(result.success).toBe(true);
  });

  it("exige que o preço anterior seja maior que o atual", () => {
    expect(
      variantInputSchema.safeParse({ ...validVariant, compareAtPriceCents: 19990 }).success,
    ).toBe(false);
    expect(
      variantInputSchema.safeParse({ ...validVariant, compareAtPriceCents: 39990 }).success,
    ).toBe(true);
  });

  it("aceita todos os status de disponibilidade previstos", () => {
    for (const status of ["disponivel", "ultimas_unidades", "sob_encomenda", "esgotado"] as const) {
      expect(
        variantInputSchema.safeParse({ ...validVariant, availabilityStatus: status }).success,
      ).toBe(true);
    }
  });
});

describe("validateImageFile", () => {
  it("aceita formatos suportados dentro do limite", () => {
    expect(validateImageFile({ size: 1_000_000, type: "image/webp" }).success).toBe(true);
  });

  it("recusa arquivos acima de 5 MB", () => {
    expect(validateImageFile({ size: 6 * 1024 * 1024, type: "image/jpeg" }).success).toBe(false);
  });

  it("recusa formatos não suportados", () => {
    expect(validateImageFile({ size: 1000, type: "image/gif" }).success).toBe(false);
    expect(validateImageFile({ size: 1000, type: "application/pdf" }).success).toBe(false);
  });
});
