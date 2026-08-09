/**
 * Configuração central da marca.
 *
 * Tudo que a loja pode querer trocar sem mexer em componentes mora aqui:
 * endereços, números de WhatsApp, redes sociais, horários e textos fixos.
 */

export type StoreUnitId = "buriti" | "centro";

export interface StoreUnit {
  id: StoreUnitId;
  /** Nome curto usado em botões e seletores. */
  name: string;
  /** Nome completo usado em títulos e dados estruturados. */
  fullName: string;
  street: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  /** Somente dígitos, com DDI e DDD — formato exigido pelo wa.me. */
  whatsappNumber: string;
  /** Formato legível, exibido na interface. */
  whatsappDisplay: string;
  /**
   * Link de rota. Se ficar `null`, o site monta uma busca no Google Maps a
   * partir do endereço completo.
   */
  mapsUrl: string | null;
  /**
   * Coordenadas para os dados estruturados JSON-LD. Deixe `null` enquanto não
   * estiverem confirmadas — o campo é simplesmente omitido.
   */
  geo: { latitude: number; longitude: number } | null;
}

export interface OpeningHours {
  /** Dias no formato schema.org: Monday, Tuesday, ... */
  days: string[];
  opens: string;
  closes: string;
}

const units: readonly StoreUnit[] = [
  {
    id: "buriti",
    name: "Buriti Shopping",
    fullName: "La Belle Essence — Buriti Shopping",
    street: "BR-060, 1044",
    district: "Jardim Campestre",
    city: "Rio Verde",
    state: "GO",
    postalCode: "75907-580",
    whatsappNumber: "5564992219841",
    whatsappDisplay: "(64) 99221-9841",
    mapsUrl: null,
    geo: null,
  },
  {
    id: "centro",
    name: "Centro",
    fullName: "La Belle Essence — Centro",
    street: "Rua Honorina Campos de Leão, 20 — Loja 03",
    district: "Jardim Bela Vista",
    city: "Rio Verde",
    state: "GO",
    postalCode: "75906-190",
    whatsappNumber: "5564992219656",
    whatsappDisplay: "(64) 99221-9656",
    mapsUrl: null,
    geo: null,
  },
] as const;

export const siteConfig = {
  name: "La Belle Essence",
  legalName: "La Belle Essence RV",
  shortDescription: "Perfumaria árabe e perfumes importados em Rio Verde, Goiás.",
  description:
    "Perfumaria árabe em Rio Verde (GO). Fragrâncias femininas, masculinas e unissex com atendimento personalizado nas unidades Centro e Buriti Shopping.",
  city: "Rio Verde",
  state: "GO",
  country: "BR",
  locale: "pt-BR",
  timeZone: "America/Sao_Paulo",
  currency: "BRL",

  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://labelleessencerv.com.br",

  social: {
    instagram: "https://www.instagram.com/labelleessencerv/",
    instagramHandle: "@labelleessencerv",
  },

  units,

  /**
   * Horário de funcionamento. Mantido como `null` porque ainda não há horário
   * confirmado pela loja — o site omite o bloco em vez de exibir informação
   * não verificada. Para publicar, substitua por algo como:
   *
   *   openingHours: [
   *     { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "19:00" },
   *     { days: ["Saturday"], opens: "09:00", closes: "13:00" },
   *   ],
   */
  openingHours: null as OpeningHours[] | null,

  /**
   * Depoimentos reais. Só preencha com avaliações efetivamente recebidas e
   * autorizadas. Vazio = a seção não é renderizada no site público.
   */
  testimonials: [] as Array<{ quote: string; author: string; unit?: string }>,

  /** Quantidade de perfumes exibidos na vitrine de destaques. */
  featuredLimit: 6,
  /** Itens por página no catálogo. */
  catalogPageSize: 12,
} as const;

export type SiteConfig = typeof siteConfig;

export function getUnit(id: StoreUnitId): StoreUnit {
  const unit = siteConfig.units.find((candidate) => candidate.id === id);
  if (!unit) {
    throw new Error(`Unidade desconhecida: ${id}`);
  }
  return unit;
}

export function formatUnitAddress(unit: StoreUnit): string {
  return `${unit.street} — ${unit.district}, ${unit.city} — ${unit.state}, ${unit.postalCode}`;
}

export function getUnitMapsUrl(unit: StoreUnit): string {
  if (unit.mapsUrl) return unit.mapsUrl;
  const query = encodeURIComponent(`${siteConfig.name} ${formatUnitAddress(unit)}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
