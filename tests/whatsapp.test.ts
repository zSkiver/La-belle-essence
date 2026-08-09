import { describe, expect, it } from "vitest";
import { buildWhatsappMessage, buildWhatsappUrl } from "@/domain/whatsapp";
import { getUnit } from "@/lib/site-config";

const buriti = getUnit("buriti");
const centro = getUnit("centro");

describe("buildWhatsappMessage", () => {
  it("inclui nome, marca, volume, preço e unidade", () => {
    const message = buildWhatsappMessage({
      unit: buriti,
      product: { name: "Khamrah", brand: "Lattafa" },
      variant: { label: "100 ml", priceCents: 42990 },
    });

    expect(message).toContain("Khamrah");
    expect(message).toContain("Lattafa");
    expect(message).toContain("100 ml");
    expect(message).toContain("R$");
    expect(message).toContain("429,90");
    expect(message).toContain("Buriti Shopping");
  });

  it("pede confirmação de disponibilidade, sem afirmar que há estoque", () => {
    const message = buildWhatsappMessage({
      unit: centro,
      product: { name: "Yara", brand: "Lattafa" },
      variant: { label: "100 ml", priceCents: 28990 },
    });

    expect(message).toContain("confirmar a disponibilidade");
    expect(message).not.toMatch(/reservado|em estoque|garantido/i);
  });

  it("omite a versão quando nenhuma variante foi escolhida", () => {
    const message = buildWhatsappMessage({
      unit: centro,
      product: { name: "Asad", brand: "Lattafa" },
      variant: null,
    });

    expect(message).toContain("Asad");
    expect(message).not.toContain("na versão");
  });

  it("gera mensagem geral quando não há produto", () => {
    const message = buildWhatsappMessage({ unit: buriti });

    expect(message).toContain("consultora");
    expect(message).toContain("Buriti Shopping");
    expect(message).not.toContain("perfume ,");
  });
});

describe("buildWhatsappUrl", () => {
  it("aponta para o número da unidade escolhida", () => {
    const urlBuriti = buildWhatsappUrl({ unit: buriti });
    const urlCentro = buildWhatsappUrl({ unit: centro });

    expect(urlBuriti.startsWith("https://wa.me/5564992219841?text=")).toBe(true);
    expect(urlCentro.startsWith("https://wa.me/5564992219656?text=")).toBe(true);
    expect(urlBuriti).not.toEqual(urlCentro);
  });

  it("codifica a mensagem para uso em URL", () => {
    const url = buildWhatsappUrl({
      unit: buriti,
      product: { name: "Shaghaf Oud", brand: "Swiss Arabian" },
      variant: { label: "50 ml", priceCents: 52990 },
    });

    // Nenhum espaço ou acento cru pode sobrar na query string.
    const query = url.split("?text=")[1] ?? "";
    expect(query).not.toContain(" ");
    expect(query).not.toMatch(/[áâãéêíóôõúç]/i);

    const decoded = decodeURIComponent(query);
    expect(decoded).toContain("Shaghaf Oud");
    expect(decoded).toContain("Swiss Arabian");
  });

  it("mantém a mensagem recuperável após a decodificação", () => {
    const input = {
      unit: centro,
      product: { name: "9 PM", brand: "Afnan" },
      variant: { label: "100 ml", priceCents: 33990 },
    };

    const url = buildWhatsappUrl(input);
    const decoded = decodeURIComponent(url.split("?text=")[1] ?? "");

    expect(decoded).toBe(buildWhatsappMessage(input));
  });
});
