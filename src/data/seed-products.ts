import type { Product, ProductVariant } from "@/domain/product";
import type {
  AvailabilityStatus,
  Badge,
  Concentration,
  FragranceFamily,
  Gender,
} from "@/domain/enums";

/**
 * DADOS DE DEMONSTRAÇÃO.
 *
 * Usados apenas quando o Supabase ainda não está configurado, para que o site
 * possa ser executado e revisado sem banco. Espelham `supabase/seed.sql`.
 *
 * Os nomes de marca e de fragrância são referências públicas do segmento.
 * **Preços, volumes e disponibilidade são valores de exemplo** e precisam ser
 * conferidos e substituídos pela loja antes de qualquer publicação.
 * Nenhum dado aqui representa estoque real.
 */

interface SeedVariant {
  sizeMl: number;
  priceCents: number;
  /** Preço anterior. Maior que o atual = promoção ativa na vitrine. */
  compareAtPriceCents?: number;
  availabilityStatus?: AvailabilityStatus;
}

interface SeedEntry {
  id: string;
  name: string;
  slug: string;
  brand: string;
  shortDescription: string;
  description: string;
  gender: Gender;
  fragranceFamily: FragranceFamily;
  concentration: Concentration;
  occasion: string;
  badge?: Badge;
  isFeatured?: boolean;
  notes: { top: string[]; heart: string[]; base: string[] };
  variants: SeedVariant[];
}

const entries: SeedEntry[] = [
  {
    id: "11111111-1111-4111-8111-000000000001",
    name: "Khamrah",
    slug: "khamrah",
    brand: "Lattafa",
    shortDescription: "Especiarias quentes e baunilha cremosa em um rastro envolvente.",
    description:
      "Uma composição doce e especiada que abre com canela e noz-moscada e evolui para tâmaras, praliné e baunilha. Marca presença em ambientes fechados e no fim de tarde.",
    gender: "unissex",
    fragranceFamily: "gourmand",
    concentration: "edp",
    occasion: "Noite e encontros",
    badge: "mais_vendido",
    isFeatured: true,
    notes: {
      top: ["Canela", "Noz-moscada", "Bergamota"],
      heart: ["Tâmara", "Praliné", "Tuberosa"],
      base: ["Baunilha", "Fava tonka", "Âmbar", "Benjoim"],
    },
    variants: [
      { sizeMl: 30, priceCents: 19990 },
      { sizeMl: 100, priceCents: 42990, compareAtPriceCents: 52990 },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000002",
    name: "Yara",
    slug: "yara",
    brand: "Lattafa",
    shortDescription: "Floral frutado leitoso, doce sem ser pesado.",
    description:
      "Orquídea e heliotrópio sobre um fundo cremoso de sândalo e baunilha. Um perfume feminino de uso fácil, que acompanha bem o dia inteiro.",
    gender: "feminino",
    fragranceFamily: "floral",
    concentration: "edp",
    occasion: "Dia a dia",
    isFeatured: true,
    notes: {
      top: ["Orquídea", "Tangerina"],
      heart: ["Heliotrópio", "Gardênia"],
      base: ["Sândalo", "Baunilha", "Almíscar"],
    },
    variants: [{ sizeMl: 100, priceCents: 28990, compareAtPriceCents: 33990 }],
  },
  {
    id: "11111111-1111-4111-8111-000000000003",
    name: "Club de Nuit Intense Man",
    slug: "club-de-nuit-intense-man",
    brand: "Armaf",
    shortDescription: "Abertura cítrica e fumê sobre um fundo amadeirado marcante.",
    description:
      "Limão e abacaxi abrem a composição, que se assenta em bétula, almíscar e baunilha. Projeção generosa e assinatura reconhecível.",
    gender: "masculino",
    fragranceFamily: "amadeirado",
    concentration: "edt",
    occasion: "Trabalho e noite",
    badge: "mais_vendido",
    isFeatured: true,
    notes: {
      top: ["Limão", "Abacaxi", "Bergamota", "Maçã"],
      heart: ["Bétula", "Jasmim", "Rosa"],
      base: ["Almíscar", "Baunilha", "Âmbar", "Patchouli"],
    },
    variants: [
      { sizeMl: 30, priceCents: 17990 },
      { sizeMl: 105, priceCents: 36990, compareAtPriceCents: 44990 },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000004",
    name: "Amber Oud Gold Edition",
    slug: "amber-oud-gold-edition",
    brand: "Al Haramain",
    shortDescription: "Âmbar e oud dourados, com frescor cítrico na abertura.",
    description:
      "Um oriental contemporâneo: bergamota e maçã dão leveza à entrada, e o fundo de âmbar, oud e almíscar sustenta o rastro por horas.",
    gender: "unissex",
    fragranceFamily: "oriental",
    concentration: "edp",
    occasion: "Ocasiões especiais",
    isFeatured: true,
    notes: {
      top: ["Bergamota", "Maçã", "Limão"],
      heart: ["Lavanda", "Gerânio"],
      base: ["Âmbar", "Oud", "Almíscar", "Baunilha"],
    },
    variants: [
      { sizeMl: 60, priceCents: 54990 },
      { sizeMl: 120, priceCents: 89990, availabilityStatus: "sob_encomenda" },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000005",
    name: "Hawas for Him",
    slug: "hawas-for-him",
    brand: "Rasasi",
    shortDescription: "Frescor aquático e frutado para o calor do Centro-Oeste.",
    description:
      "Maçã, canela e bergamota em uma abertura viva, com fundo de âmbar cinzento e almíscar. Escolha natural para o dia e para climas quentes.",
    gender: "masculino",
    fragranceFamily: "fresco",
    concentration: "edp",
    occasion: "Dia e clima quente",
    notes: {
      top: ["Maçã", "Bergamota", "Canela"],
      heart: ["Jasmim", "Notas aquáticas", "Magnólia"],
      base: ["Âmbar cinzento", "Almíscar", "Cedro"],
    },
    variants: [{ sizeMl: 100, priceCents: 46990 }],
  },
  {
    id: "11111111-1111-4111-8111-000000000006",
    name: "Shaghaf Oud",
    slug: "shaghaf-oud",
    brand: "Swiss Arabian",
    shortDescription: "Oud, rosa e açafrão — perfumaria árabe no seu registro clássico.",
    description:
      "Um oriental denso construído sobre oud e rosa, com açafrão na abertura e baunilha no fundo. Pouca quantidade já é suficiente.",
    gender: "unissex",
    fragranceFamily: "oriental",
    concentration: "edp",
    occasion: "Noite",
    badge: "destaque",
    isFeatured: true,
    notes: {
      top: ["Açafrão", "Notas frutadas"],
      heart: ["Rosa", "Oud"],
      base: ["Baunilha", "Âmbar", "Almíscar"],
    },
    variants: [
      { sizeMl: 50, priceCents: 52990, compareAtPriceCents: 64990 },
      { sizeMl: 75, priceCents: 68990, availabilityStatus: "ultimas_unidades" },
    ],
  },
  {
    id: "11111111-1111-4111-8111-000000000007",
    name: "9 PM",
    slug: "9-pm",
    brand: "Afnan",
    shortDescription: "Maçã, canela e baunilha para a noite.",
    description:
      "Doce e especiado, com abertura de maçã e lavanda e fundo de baunilha e fava tonka. Um gourmand masculino de uso simples.",
    gender: "masculino",
    fragranceFamily: "gourmand",
    concentration: "edp",
    occasion: "Noite",
    notes: {
      top: ["Maçã", "Lavanda", "Bergamota"],
      heart: ["Canela", "Íris"],
      base: ["Baunilha", "Fava tonka", "Âmbar"],
    },
    variants: [{ sizeMl: 100, priceCents: 33990 }],
  },
  {
    id: "11111111-1111-4111-8111-000000000008",
    name: "Asad",
    slug: "asad",
    brand: "Lattafa",
    shortDescription: "Abacaxi, tabaco e baunilha em um amadeirado escuro.",
    description:
      "Abertura frutada que rapidamente cede lugar a tabaco, canela e baunilha. Rastro quente, indicado para as horas mais frescas do dia.",
    gender: "masculino",
    fragranceFamily: "amadeirado",
    concentration: "edp",
    occasion: "Noite e clima ameno",
    badge: "lancamento",
    notes: {
      top: ["Abacaxi", "Bergamota", "Pimenta"],
      heart: ["Tabaco", "Canela", "Gerânio"],
      base: ["Baunilha", "Fava tonka", "Cedro", "Almíscar"],
    },
    variants: [{ sizeMl: 100, priceCents: 31990 }],
  },
];

const BASE_DATE = new Date("2026-01-15T12:00:00.000Z");

function buildVariants(entry: SeedEntry): ProductVariant[] {
  return entry.variants.map((variant, index) => ({
    id: `${entry.id.slice(0, -3)}v${String(index + 1).padStart(2, "0")}`,
    productId: entry.id,
    sizeMl: variant.sizeMl,
    label: null,
    priceCents: variant.priceCents,
    compareAtPriceCents: variant.compareAtPriceCents ?? null,
    availabilityStatus: variant.availabilityStatus ?? "disponivel",
    sortOrder: index,
  }));
}

function toProduct(entry: SeedEntry, index: number): Product {
  // Datas decrescentes para que a ordenação "Lançamentos" tenha o que mostrar.
  const createdAt = new Date(BASE_DATE.getTime() - index * 86_400_000).toISOString();

  return {
    id: entry.id,
    name: entry.name,
    slug: entry.slug,
    brand: entry.brand,
    shortDescription: entry.shortDescription,
    description: entry.description,
    gender: entry.gender,
    fragranceFamily: entry.fragranceFamily,
    concentration: entry.concentration,
    occasion: entry.occasion,
    badge: entry.badge ?? null,
    isFeatured: entry.isFeatured ?? false,
    isActive: true,
    sortOrder: index,
    offerStartsAt: null,
    offerEndsAt: null,
    createdAt,
    updatedAt: createdAt,
    variants: buildVariants(entry),
    images: [],
    notes: (["top", "heart", "base"] as const).map((level, levelIndex) => ({
      id: `${entry.id.slice(0, -3)}n${levelIndex}`,
      productId: entry.id,
      level,
      notes: entry.notes[level],
      sortOrder: levelIndex,
    })),
  };
}

export const SEED_PRODUCTS: Product[] = entries.map(toProduct);
