/**
 * Vocabulário do domínio. Os valores são estáveis (usados no banco e nas URLs);
 * os rótulos são o que aparece na interface, sempre em português do Brasil.
 */

export const GENDERS = ["feminino", "masculino", "unissex"] as const;
export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  feminino: "Feminino",
  masculino: "Masculino",
  unissex: "Unissex",
};

/** Rótulo usado nos títulos das seções de universo. */
export const GENDER_PLURAL_LABELS: Record<Gender, string> = {
  feminino: "Femininos",
  masculino: "Masculinos",
  unissex: "Unissex",
};

export const FRAGRANCE_FAMILIES = [
  "floral",
  "amadeirado",
  "oriental",
  "fresco",
  "citrico",
  "gourmand",
  "especiado",
  "couro",
] as const;
export type FragranceFamily = (typeof FRAGRANCE_FAMILIES)[number];

export const FRAGRANCE_FAMILY_LABELS: Record<FragranceFamily, string> = {
  floral: "Floral",
  amadeirado: "Amadeirado",
  oriental: "Oriental",
  fresco: "Fresco",
  citrico: "Cítrico",
  gourmand: "Gourmand",
  especiado: "Especiado",
  couro: "Couro",
};

export const CONCENTRATIONS = ["edt", "edp", "parfum", "extrait", "outra"] as const;
export type Concentration = (typeof CONCENTRATIONS)[number];

export const CONCENTRATION_LABELS: Record<Concentration, string> = {
  edt: "Eau de Toilette",
  edp: "Eau de Parfum",
  parfum: "Parfum",
  extrait: "Extrait de Parfum",
  outra: "Outra",
};

export const CONCENTRATION_SHORT_LABELS: Record<Concentration, string> = {
  edt: "EDT",
  edp: "EDP",
  parfum: "Parfum",
  extrait: "Extrait",
  outra: "—",
};

/**
 * Intensidade estimada a partir da concentração.
 *
 * Não é uma medição: é a convenção da perfumaria de que mais concentração de
 * óleo essencial significa rastro mais forte e mais duradouro. A interface
 * sempre rotula o dado como estimativa, justamente para não passar por medição.
 */
export const CONCENTRATION_INTENSITY: Record<Concentration, number | null> = {
  edt: 2,
  edp: 3,
  parfum: 4,
  extrait: 5,
  outra: null,
};

export const INTENSITY_SCALE = 5;

export const AVAILABILITY_STATUSES = [
  "disponivel",
  "ultimas_unidades",
  "sob_encomenda",
  "esgotado",
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  disponivel: "Disponível",
  ultimas_unidades: "Últimas unidades",
  sob_encomenda: "Por encomenda",
  esgotado: "Esgotado",
};

/**
 * Uma variante esgotada nunca pode ser apresentada como pronta para retirada.
 * Este predicado é a única fonte de verdade dessa regra.
 */
export function isPurchasable(status: AvailabilityStatus): boolean {
  return status !== "esgotado";
}

export const BADGES = ["lancamento", "destaque", "mais_vendido", "ultimas_unidades"] as const;
export type Badge = (typeof BADGES)[number];

export const BADGE_LABELS: Record<Badge, string> = {
  lancamento: "Lançamento",
  destaque: "Destaque",
  mais_vendido: "Mais vendido",
  ultimas_unidades: "Últimas unidades",
};

export const NOTE_LEVELS = ["top", "heart", "base"] as const;
export type NoteLevel = (typeof NOTE_LEVELS)[number];

export const NOTE_LEVEL_LABELS: Record<NoteLevel, string> = {
  top: "Notas de topo",
  heart: "Notas de coração",
  base: "Notas de fundo",
};

export const SORT_OPTIONS = ["destaque", "menor_preco", "maior_preco", "lancamentos"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABELS: Record<SortOption, string> = {
  destaque: "Destaques",
  menor_preco: "Menor preço",
  maior_preco: "Maior preço",
  lancamentos: "Lançamentos",
};

/** Origem do clique de WhatsApp — permite separar as métricas por contexto. */
export const CLICK_SOURCES = [
  "hero",
  "header",
  "product_card",
  "product_modal",
  "floating_button",
  "final_cta",
  "unit_section",
  "catalog_empty",
  "promotions",
  "campaign",
] as const;
export type ClickSource = (typeof CLICK_SOURCES)[number];

export function isGender(value: string): value is Gender {
  return (GENDERS as readonly string[]).includes(value);
}

export function isFragranceFamily(value: string): value is FragranceFamily {
  return (FRAGRANCE_FAMILIES as readonly string[]).includes(value);
}

export function isConcentration(value: string): value is Concentration {
  return (CONCENTRATIONS as readonly string[]).includes(value);
}

export function isAvailabilityStatus(value: string): value is AvailabilityStatus {
  return (AVAILABILITY_STATUSES as readonly string[]).includes(value);
}

export function isSortOption(value: string): value is SortOption {
  return (SORT_OPTIONS as readonly string[]).includes(value);
}
