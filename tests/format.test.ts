import { describe, expect, it } from "vitest";
import {
  centsToPriceInput,
  formatDateTime,
  formatPrice,
  formatPriceFrom,
  parsePriceToCents,
} from "@/domain/format";

/** O espaço usado pelo Intl entre "R$" e o número pode ser não separável. */
function normalizeSpaces(value: string): string {
  return value.replace(/ | /g, " ");
}

describe("formatPrice", () => {
  it("formata centavos como moeda brasileira", () => {
    expect(normalizeSpaces(formatPrice(28990))).toBe("R$ 289,90");
    expect(normalizeSpaces(formatPrice(100))).toBe("R$ 1,00");
    expect(normalizeSpaces(formatPrice(0))).toBe("R$ 0,00");
  });

  it("usa ponto como separador de milhar", () => {
    expect(normalizeSpaces(formatPrice(189990))).toBe("R$ 1.899,90");
  });
});

describe("formatPriceFrom", () => {
  it('prefixa "A partir de" quando há mais de um volume', () => {
    expect(normalizeSpaces(formatPriceFrom(19990, true))).toBe("A partir de R$ 199,90");
  });

  it("mostra o preço direto quando há um único volume", () => {
    expect(normalizeSpaces(formatPriceFrom(19990, false))).toBe("R$ 199,90");
  });
});

describe("parsePriceToCents", () => {
  it("aceita o formato brasileiro digitado pelo administrador", () => {
    expect(parsePriceToCents("289,90")).toBe(28990);
    expect(parsePriceToCents("R$ 289,90")).toBe(28990);
    expect(parsePriceToCents("1.899,90")).toBe(189990);
    expect(parsePriceToCents("50")).toBe(5000);
  });

  it("rejeita entradas vazias ou inválidas", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("abc")).toBeNull();
    expect(parsePriceToCents("-10")).toBeNull();
  });

  it("faz o caminho de ida e volta com centsToPriceInput", () => {
    expect(parsePriceToCents(centsToPriceInput(42990))).toBe(42990);
  });
});

describe("centsToPriceInput", () => {
  it("usa vírgula decimal e sempre duas casas", () => {
    expect(centsToPriceInput(42990)).toBe("429,90");
    expect(centsToPriceInput(5000)).toBe("50,00");
  });

  it("devolve string vazia para valores ausentes", () => {
    expect(centsToPriceInput(null)).toBe("");
    expect(centsToPriceInput(undefined)).toBe("");
  });
});

describe("formatDateTime", () => {
  it("apresenta a data no fuso de São Paulo", () => {
    // 15/01/2026 12:00 UTC = 09:00 em São Paulo (UTC-3).
    expect(formatDateTime("2026-01-15T12:00:00.000Z")).toContain("09:00");
  });

  it("não quebra com datas inválidas", () => {
    expect(formatDateTime("não é data")).toBe("—");
  });
});
