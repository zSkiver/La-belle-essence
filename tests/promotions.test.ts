import { describe, expect, it } from "vitest";
import type { Product, ProductVariant } from "@/domain/product";
import {
  bestDiscount,
  formatTimeRemaining,
  hasDiscountPrice,
  hasPromotion,
  highestPercentOff,
  isOfferWindowOpen,
  offerStatus,
  offerTimeRemaining,
  promotionalProducts,
  splitDuration,
  variantDiscount,
} from "@/domain/promotions";
import { SEED_PRODUCTS } from "@/data/seed-products";

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "v1",
    productId: "p1",
    sizeMl: 100,
    label: null,
    priceCents: 28990,
    compareAtPriceCents: null,
    availabilityStatus: "disponivel",
    sortOrder: 0,
    ...overrides,
  };
}

function product(variants: ProductVariant[], overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Teste",
    slug: "teste",
    brand: "Marca",
    shortDescription: null,
    description: null,
    gender: "unissex",
    fragranceFamily: null,
    concentration: null,
    occasion: null,
    badge: null,
    isFeatured: false,
    isActive: true,
    sortOrder: 0,
    offerStartsAt: null,
    offerEndsAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    variants,
    images: [],
    notes: [],
    ...overrides,
  };
}

describe("variantDiscount", () => {
  it("calcula o percentual e a economia", () => {
    const discount = variantDiscount(
      variant({ priceCents: 28990, compareAtPriceCents: 33990 }),
    );

    expect(discount).not.toBeNull();
    expect(discount?.percentOff).toBe(15);
    expect(discount?.savedCents).toBe(5000);
  });

  it("não existe promoção sem preço anterior", () => {
    expect(variantDiscount(variant({ compareAtPriceCents: null }))).toBeNull();
  });

  it("não existe promoção quando o preço anterior é menor ou igual", () => {
    expect(variantDiscount(variant({ priceCents: 30000, compareAtPriceCents: 30000 }))).toBeNull();
    expect(variantDiscount(variant({ priceCents: 30000, compareAtPriceCents: 25000 }))).toBeNull();
  });

  it("ignora variante esgotada — não se anuncia desconto no que não pode ser pedido", () => {
    expect(
      variantDiscount(
        variant({ priceCents: 20000, compareAtPriceCents: 30000, availabilityStatus: "esgotado" }),
      ),
    ).toBeNull();
  });

  it("aceita últimas unidades e por encomenda", () => {
    for (const status of ["ultimas_unidades", "sob_encomenda"] as const) {
      expect(
        variantDiscount(
          variant({ priceCents: 20000, compareAtPriceCents: 30000, availabilityStatus: status }),
        ),
      ).not.toBeNull();
    }
  });
});

describe("bestDiscount", () => {
  it("escolhe o maior percentual entre as variantes", () => {
    const discount = bestDiscount(
      product([
        variant({ id: "a", priceCents: 28990, compareAtPriceCents: 33990 }), // 15%
        variant({ id: "b", priceCents: 20000, compareAtPriceCents: 40000 }), // 50%
      ]),
    );

    expect(discount?.variantId).toBe("b");
    expect(discount?.percentOff).toBe(50);
  });

  it("devolve null quando nenhuma variante tem desconto", () => {
    expect(bestDiscount(product([variant()]))).toBeNull();
    expect(bestDiscount(product([]))).toBeNull();
  });

  it("desconsidera desconto exclusivo de variante esgotada", () => {
    const target = product([
      variant({ id: "a", priceCents: 10000, compareAtPriceCents: 30000, availabilityStatus: "esgotado" }),
      variant({ id: "b", priceCents: 28990, compareAtPriceCents: null }),
    ]);

    expect(bestDiscount(target)).toBeNull();
    expect(hasPromotion(target)).toBe(false);
  });
});

describe("promotionalProducts", () => {
  it("ordena do maior para o menor desconto", () => {
    const list = [
      product([variant({ priceCents: 9000, compareAtPriceCents: 10000 })], { id: "dez", slug: "dez" }),
      product([variant({ priceCents: 5000, compareAtPriceCents: 10000 })], { id: "cinquenta", slug: "cinquenta" }),
      product([variant()], { id: "sem", slug: "sem" }),
    ];

    expect(promotionalProducts(list).map((item) => item.id)).toEqual(["cinquenta", "dez"]);
  });

  it("devolve lista vazia quando não há promoções", () => {
    expect(promotionalProducts([product([variant()])])).toHaveLength(0);
  });
});

describe("highestPercentOff", () => {
  it("informa o maior desconto do catálogo", () => {
    const list = [
      product([variant({ priceCents: 9000, compareAtPriceCents: 10000 })], { id: "a" }),
      product([variant({ priceCents: 6000, compareAtPriceCents: 10000 })], { id: "b" }),
    ];

    expect(highestPercentOff(list)).toBe(40);
  });

  it("devolve null sem promoções — a barra do topo não aparece", () => {
    expect(highestPercentOff([product([variant()])])).toBeNull();
    expect(highestPercentOff([])).toBeNull();
  });
});

describe("dados de demonstração", () => {
  it("trazem promoções para a vitrine poder ser revisada", () => {
    const promos = promotionalProducts(SEED_PRODUCTS);
    expect(promos.length).toBeGreaterThan(0);
    expect(highestPercentOff(SEED_PRODUCTS)).toBeGreaterThan(0);
  });

  it("todo desconto do seed tem preço anterior maior que o atual", () => {
    for (const item of SEED_PRODUCTS) {
      for (const entry of item.variants) {
        if (entry.compareAtPriceCents !== null) {
          expect(entry.compareAtPriceCents).toBeGreaterThan(entry.priceCents);
        }
      }
    }
  });
});

describe("janela de oferta", () => {
  const comDesconto = [variant({ priceCents: 5000, compareAtPriceCents: 10000 })];
  const agora = new Date("2026-08-10T12:00:00.000Z");

  it("sem janela, a oferta vale sempre", () => {
    const alvo = product(comDesconto);
    expect(bestDiscount(alvo, agora)?.percentOff).toBe(50);
    expect(offerStatus(alvo, agora)).toBe("ativa");
  });

  it("antes do início, a oferta ainda não existe para o site", () => {
    const alvo = product(comDesconto, { offerStartsAt: "2026-08-11T00:00:00.000Z" });
    expect(bestDiscount(alvo, agora)).toBeNull();
    expect(hasPromotion(alvo, agora)).toBe(false);
    expect(offerStatus(alvo, agora)).toBe("agendada");
  });

  it("depois do fim, a oferta some sozinha", () => {
    const alvo = product(comDesconto, { offerEndsAt: "2026-08-10T11:00:00.000Z" });
    expect(bestDiscount(alvo, agora)).toBeNull();
    expect(offerStatus(alvo, agora)).toBe("encerrada");
  });

  it("dentro do intervalo, vale", () => {
    const alvo = product(comDesconto, {
      offerStartsAt: "2026-08-10T09:00:00.000Z",
      offerEndsAt: "2026-08-10T18:00:00.000Z",
    });
    expect(bestDiscount(alvo, agora)?.percentOff).toBe(50);
    expect(offerStatus(alvo, agora)).toBe("ativa");
  });

  it("o instante do fim já conta como encerrado", () => {
    const alvo = product(comDesconto, { offerEndsAt: agora.toISOString() });
    expect(bestDiscount(alvo, agora)).toBeNull();
  });

  it("sem preço promocional não há oferta, mesmo com janela aberta", () => {
    const alvo = product([variant()], { offerEndsAt: "2026-12-31T00:00:00.000Z" });
    expect(offerStatus(alvo, agora)).toBe("sem_oferta");
    expect(hasDiscountPrice(alvo)).toBe(false);
  });

  it("data inválida não restringe a oferta", () => {
    const alvo = product(comDesconto, { offerEndsAt: "não é data" });
    expect(bestDiscount(alvo, agora)?.percentOff).toBe(50);
  });

  it("a vitrine só lista o que está no ar", () => {
    const lista = [
      product(comDesconto, { id: "ativa", slug: "ativa" }),
      product(comDesconto, {
        id: "agendada",
        slug: "agendada",
        offerStartsAt: "2026-09-01T00:00:00.000Z",
      }),
      product(comDesconto, {
        id: "encerrada",
        slug: "encerrada",
        offerEndsAt: "2026-08-01T00:00:00.000Z",
      }),
    ];

    expect(promotionalProducts(lista, agora).map((item) => item.id)).toEqual(["ativa"]);
    expect(highestPercentOff(lista, agora)).toBe(50);
  });
});

describe("contagem regressiva", () => {
  const agora = new Date("2026-08-10T12:00:00.000Z");

  it("devolve null quando não há prazo", () => {
    expect(offerTimeRemaining(product([variant()]), agora)).toBeNull();
  });

  it("mede o que falta e nunca fica negativo", () => {
    const emDuasHoras = product([variant()], { offerEndsAt: "2026-08-10T14:00:00.000Z" });
    expect(offerTimeRemaining(emDuasHoras, agora)).toBe(2 * 3_600_000);

    const vencida = product([variant()], { offerEndsAt: "2026-08-09T00:00:00.000Z" });
    expect(offerTimeRemaining(vencida, agora)).toBe(0);
  });

  it("quebra a duração em dias, horas e minutos", () => {
    expect(splitDuration(90 * 60_000)).toEqual({ days: 0, hours: 1, minutes: 30 });
    expect(splitDuration(50 * 3_600_000)).toEqual({ days: 2, hours: 2, minutes: 0 });
  });

  it("escreve o texto na unidade mais legível", () => {
    expect(formatTimeRemaining(3 * 86_400_000)).toBe("restam 3 dias");
    expect(formatTimeRemaining(86_400_000)).toBe("resta 1 dia");
    expect(formatTimeRemaining(5 * 3_600_000 + 20 * 60_000)).toBe("restam 5 h 20 min");
    expect(formatTimeRemaining(60_000)).toBe("resta 1 minuto");
    expect(formatTimeRemaining(0)).toBe("termina agora");
  });
});

describe("isOfferWindowOpen", () => {
  const agora = new Date("2026-08-10T12:00:00.000Z");

  it("janela vazia está sempre aberta", () => {
    expect(isOfferWindowOpen({ startsAt: null, endsAt: null }, agora)).toBe(true);
  });

  it("respeita cada extremo", () => {
    expect(isOfferWindowOpen({ startsAt: "2026-08-10T13:00:00.000Z", endsAt: null }, agora)).toBe(false);
    expect(isOfferWindowOpen({ startsAt: null, endsAt: "2026-08-10T13:00:00.000Z" }, agora)).toBe(true);
    expect(isOfferWindowOpen({ startsAt: null, endsAt: "2026-08-10T11:00:00.000Z" }, agora)).toBe(false);
  });
});
