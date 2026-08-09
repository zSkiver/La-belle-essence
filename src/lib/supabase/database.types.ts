/**
 * Tipos do banco, mantidos à mão para espelhar `supabase/migrations/`.
 *
 * Se você alterar o schema, atualize este arquivo (ou gere-o novamente com
 * `supabase gen types typescript --linked > src/lib/supabase/database.types.ts`).
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type DbGender = "feminino" | "masculino" | "unissex";
export type DbFragranceFamily =
  | "floral"
  | "amadeirado"
  | "oriental"
  | "fresco"
  | "citrico"
  | "gourmand"
  | "especiado"
  | "couro";
export type DbConcentration = "edt" | "edp" | "parfum" | "extrait" | "outra";
export type DbAvailabilityStatus =
  | "disponivel"
  | "ultimas_unidades"
  | "sob_encomenda"
  | "esgotado";
export type DbBadge = "lancamento" | "destaque" | "mais_vendido" | "ultimas_unidades";
export type DbNoteLevel = "top" | "heart" | "base";
export type DbStoreUnit = "buriti" | "centro";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  short_description: string | null;
  description: string | null;
  gender: DbGender;
  fragrance_family: DbFragranceFamily | null;
  concentration: DbConcentration | null;
  occasion: string | null;
  badge: DbBadge | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  offer_starts_at: string | null;
  offer_ends_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductVariantRow = {
  id: string;
  product_id: string;
  size_ml: number | null;
  label: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  availability_status: DbAvailabilityStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export type OlfactoryNoteRow = {
  id: string;
  product_id: string;
  level: DbNoteLevel;
  notes: string[];
  sort_order: number;
}

export type WhatsappClickRow = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  store_unit: DbStoreUnit;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  created_at: string;
}

export type SiteSettingRow = {
  key: string;
  value: Json;
  updated_at: string;
}

export type AdminUserRow = {
  user_id: string;
  display_name: string | null;
  created_at: string;
}

/**
 * Achata a interseção em um único tipo mapeado. Sem isso o resultado não é
 * atribuível a `Record<string, unknown>` e o supabase-js perde a inferência dos
 * payloads de insert.
 */
type Flatten<T> = { [K in keyof T]: T[K] };

type Insertable<Row, Optional extends keyof Row> = Flatten<
  Omit<Row, Optional> & Partial<Pick<Row, Optional>>
>;

/**
 * Chave estrangeira para `products.id`. O supabase-js usa estas declarações
 * para validar as consultas com relações aninhadas (`product_variants(*)` etc.).
 */
type BelongsToProduct<FkName extends string> = [
  {
    foreignKeyName: FkName;
    columns: ["product_id"];
    isOneToOne: false;
    referencedRelation: "products";
    referencedColumns: ["id"];
  },
];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: ProductRow;
        Insert: Insertable<
          ProductRow,
          | "id"
          | "short_description"
          | "description"
          | "fragrance_family"
          | "concentration"
          | "occasion"
          | "badge"
          | "is_featured"
          | "is_active"
          | "sort_order"
          | "offer_starts_at"
          | "offer_ends_at"
          | "deleted_at"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      product_variants: {
        Row: ProductVariantRow;
        Insert: Insertable<
          ProductVariantRow,
          | "id"
          | "size_ml"
          | "label"
          | "compare_at_price_cents"
          | "availability_status"
          | "sort_order"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<ProductVariantRow>;
        Relationships: BelongsToProduct<"product_variants_product_id_fkey">;
      };
      product_images: {
        Row: ProductImageRow;
        Insert: Insertable<
          ProductImageRow,
          "id" | "alt_text" | "is_cover" | "sort_order" | "created_at"
        >;
        Update: Partial<ProductImageRow>;
        Relationships: BelongsToProduct<"product_images_product_id_fkey">;
      };
      olfactory_notes: {
        Row: OlfactoryNoteRow;
        Insert: Insertable<OlfactoryNoteRow, "id" | "notes" | "sort_order">;
        Update: Partial<OlfactoryNoteRow>;
        Relationships: BelongsToProduct<"olfactory_notes_product_id_fkey">;
      };
      whatsapp_clicks: {
        Row: WhatsappClickRow;
        Insert: Insertable<
          WhatsappClickRow,
          | "id"
          | "product_id"
          | "variant_id"
          | "utm_source"
          | "utm_medium"
          | "utm_campaign"
          | "referrer"
          | "created_at"
        >;
        Update: Partial<WhatsappClickRow>;
        Relationships: [
          {
            foreignKeyName: "whatsapp_clicks_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_clicks_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: SiteSettingRow;
        Insert: Insertable<SiteSettingRow, "value" | "updated_at">;
        Update: Partial<SiteSettingRow>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Insertable<AdminUserRow, "display_name" | "created_at">;
        Update: Partial<AdminUserRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<never, never>;
        Returns: boolean;
      };
    };
    Enums: {
      product_gender: DbGender;
      fragrance_family: DbFragranceFamily;
      product_concentration: DbConcentration;
      availability_status: DbAvailabilityStatus;
      product_badge: DbBadge;
      note_level: DbNoteLevel;
      store_unit: DbStoreUnit;
    };
    CompositeTypes: Record<never, never>;
  };
}
