import type { Product, ProductImage, ProductVariant, OlfactoryNote } from "@/domain/product";
import type {
  OlfactoryNoteRow,
  ProductImageRow,
  ProductRow,
  ProductVariantRow,
} from "@/lib/supabase/database.types";

/** Linha do banco + relações carregadas na mesma consulta. */
export interface ProductRowWithRelations extends ProductRow {
  product_variants: ProductVariantRow[] | null;
  product_images: ProductImageRow[] | null;
  olfactory_notes: OlfactoryNoteRow[] | null;
}

export function mapVariant(row: ProductVariantRow): ProductVariant {
  return {
    id: row.id,
    productId: row.product_id,
    sizeMl: row.size_ml,
    label: row.label,
    priceCents: row.price_cents,
    compareAtPriceCents: row.compare_at_price_cents,
    availabilityStatus: row.availability_status,
    sortOrder: row.sort_order,
  };
}

export function mapImage(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    altText: row.alt_text,
    isCover: row.is_cover,
    sortOrder: row.sort_order,
  };
}

export function mapNote(row: OlfactoryNoteRow): OlfactoryNote {
  return {
    id: row.id,
    productId: row.product_id,
    level: row.level,
    notes: row.notes ?? [],
    sortOrder: row.sort_order,
  };
}

export function mapProduct(row: ProductRowWithRelations): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    shortDescription: row.short_description,
    description: row.description,
    gender: row.gender,
    fragranceFamily: row.fragrance_family,
    concentration: row.concentration,
    occasion: row.occasion,
    badge: row.badge,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    offerStartsAt: row.offer_starts_at,
    offerEndsAt: row.offer_ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    variants: (row.product_variants ?? []).map(mapVariant).sort((a, b) => a.sortOrder - b.sortOrder),
    images: (row.product_images ?? []).map(mapImage).sort((a, b) => a.sortOrder - b.sortOrder),
    notes: (row.olfactory_notes ?? []).map(mapNote).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export const PRODUCT_SELECT =
  "*, product_variants(*), product_images(*), olfactory_notes(*)" as const;
