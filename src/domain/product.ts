import type { OfferStatus } from "./promotions";
import type {
  AvailabilityStatus,
  Badge,
  Concentration,
  FragranceFamily,
  Gender,
  NoteLevel,
} from "./enums";

export interface ProductVariant {
  id: string;
  productId: string;
  /** Volume em mililitros. `null` para apresentações sem volume definido. */
  sizeMl: number | null;
  /** Rótulo exibido. Quando ausente, é derivado de `sizeMl` (ex.: "50 ml"). */
  label: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  availabilityStatus: AvailabilityStatus;
  sortOrder: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  /** Caminho dentro do bucket do Supabase Storage. */
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  isCover: boolean;
  sortOrder: number;
}

export interface OlfactoryNote {
  id: string;
  productId: string;
  level: NoteLevel;
  notes: string[];
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  shortDescription: string | null;
  description: string | null;
  gender: Gender;
  fragranceFamily: FragranceFamily | null;
  concentration: Concentration | null;
  /** Ocasião ou sensação transmitida — texto livre curto. */
  occasion: string | null;
  badge: Badge | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  /** Início da janela de oferta. `null` = já vale. */
  offerStartsAt: string | null;
  /** Fim da janela de oferta. `null` = sem prazo. */
  offerEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  images: ProductImage[];
  notes: OlfactoryNote[];
}

/** Produto sem relações — usado nas listagens do painel administrativo. */
export type ProductSummary = Omit<Product, "variants" | "images" | "notes"> & {
  variantCount: number;
  imageCount: number;
  lowestPriceCents: number | null;
  coverImageUrl: string | null;
  /** Alguma variante disponível tem preço anterior maior que o atual. */
  hasPromotion: boolean;
  /** Em que ponto da vida a oferta está: sem oferta, agendada, ativa, encerrada. */
  offerStatus: OfferStatus;
  /** Maior percentual de desconto cadastrado, independentemente da janela. */
  bestPercentOff: number | null;
};
