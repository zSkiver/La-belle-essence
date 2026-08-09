import { formatPrice } from "./format";
import type { StoreUnit } from "@/lib/site-config";
import { siteConfig } from "@/lib/site-config";

export interface WhatsappProductContext {
  name: string;
  brand: string;
}

export interface WhatsappVariantContext {
  label: string;
  priceCents: number;
}

export interface WhatsappMessageInput {
  unit: StoreUnit;
  product?: WhatsappProductContext | null;
  variant?: WhatsappVariantContext | null;
}

/**
 * Monta a mensagem enviada ao WhatsApp.
 *
 * O texto pede confirmação de disponibilidade — nunca afirma que o produto está
 * reservado ou em estoque, porque isso só a loja pode confirmar.
 */
export function buildWhatsappMessage({ unit, product, variant }: WhatsappMessageInput): string {
  const opening = `Olá! Vim pelo site da ${siteConfig.name}`;

  if (!product) {
    return (
      `${opening} e gostaria de conversar com uma consultora sobre as fragrâncias disponíveis. ` +
      `Meu atendimento seria na unidade ${unit.name}.`
    );
  }

  const version = variant
    ? `, na versão ${variant.label}, por ${formatPrice(variant.priceCents)}`
    : "";

  return (
    `${opening} e tenho interesse no perfume ${product.name}, da ${product.brand}${version}. ` +
    `Gostaria de confirmar a disponibilidade para atendimento na unidade ${unit.name}.`
  );
}

/** Link wa.me com a mensagem já codificada. */
export function buildWhatsappUrl(input: WhatsappMessageInput): string {
  const message = buildWhatsappMessage(input);
  return `https://wa.me/${input.unit.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
