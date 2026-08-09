-- ---------------------------------------------------------------------------
-- La Belle Essence RV — estrutura inicial
--
-- Valores financeiros são sempre inteiros em centavos.
-- Exclusão de produtos é lógica (`deleted_at`) para preservar as métricas de
-- cliques já registradas.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- Vocabulário do domínio ------------------------------------------------------

create type public.product_gender as enum ('feminino', 'masculino', 'unissex');

create type public.fragrance_family as enum (
  'floral', 'amadeirado', 'oriental', 'fresco', 'citrico', 'gourmand', 'especiado', 'couro'
);

create type public.product_concentration as enum ('edt', 'edp', 'parfum', 'extrait', 'outra');

create type public.availability_status as enum (
  'disponivel', 'ultimas_unidades', 'sob_encomenda', 'esgotado'
);

create type public.product_badge as enum (
  'lancamento', 'destaque', 'mais_vendido', 'ultimas_unidades'
);

create type public.note_level as enum ('top', 'heart', 'base');

create type public.store_unit as enum ('buriti', 'centro');

-- Administradores -------------------------------------------------------------
-- Não existe cadastro público. Um usuário só vira administrador quando alguém
-- com acesso ao projeto insere a linha correspondente aqui.

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Lista de administradores. Inserção manual apenas (Supabase Studio ou service role).';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

comment on function public.is_admin() is
  'Verdadeiro quando o usuário autenticado consta em admin_users. Base de todas as policies de escrita.';

-- updated_at ------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Produtos --------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand text not null check (char_length(trim(brand)) between 1 and 80),
  short_description text check (char_length(short_description) <= 180),
  description text check (char_length(description) <= 4000),
  gender public.product_gender not null,
  fragrance_family public.fragrance_family,
  concentration public.product_concentration,
  occasion text check (char_length(occasion) <= 120),
  badge public.product_badge,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 180),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- O slug só precisa ser único entre os produtos vivos: assim um produto
-- excluído não bloqueia o cadastro de um novo com o mesmo nome.
create unique index products_slug_active_key
  on public.products (slug)
  where deleted_at is null;

create index products_public_listing_idx
  on public.products (is_featured desc, sort_order, name)
  where deleted_at is null and is_active;

create index products_brand_idx on public.products (brand);
create index products_gender_idx on public.products (gender);
create index products_created_at_idx on public.products (created_at desc);

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- Variantes de volume ---------------------------------------------------------

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size_ml integer check (size_ml > 0 and size_ml <= 2000),
  label text check (char_length(label) <= 40),
  price_cents integer not null check (price_cents > 0),
  compare_at_price_cents integer check (compare_at_price_cents > 0),
  availability_status public.availability_status not null default 'disponivel',
  sku text check (char_length(sku) <= 64),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_needs_identity check (size_ml is not null or label is not null),
  constraint product_variants_compare_price_higher
    check (compare_at_price_cents is null or compare_at_price_cents > price_cents)
);

create index product_variants_product_idx on public.product_variants (product_id, sort_order);
create index product_variants_price_idx on public.product_variants (price_cents);

create trigger product_variants_touch_updated_at
  before update on public.product_variants
  for each row execute function public.touch_updated_at();

-- Imagens ---------------------------------------------------------------------

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text check (char_length(alt_text) <= 160),
  is_cover boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- No máximo uma capa por produto.
create unique index product_images_single_cover_key
  on public.product_images (product_id)
  where is_cover;

-- Pirâmide olfativa -----------------------------------------------------------

create table public.olfactory_notes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  level public.note_level not null,
  notes text[] not null default '{}',
  sort_order integer not null default 0 check (sort_order >= 0),
  constraint olfactory_notes_unique_level unique (product_id, level)
);

create index olfactory_notes_product_idx on public.olfactory_notes (product_id);

-- Cliques de WhatsApp ---------------------------------------------------------
-- As referências usam ON DELETE SET NULL: se um produto for removido em
-- definitivo, o clique continua contando para o histórico.

create table public.whatsapp_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  store_unit public.store_unit not null,
  source text not null check (char_length(source) <= 40),
  utm_source text check (char_length(utm_source) <= 120),
  utm_medium text check (char_length(utm_medium) <= 120),
  utm_campaign text check (char_length(utm_campaign) <= 120),
  referrer text check (char_length(referrer) <= 500),
  created_at timestamptz not null default now()
);

create index whatsapp_clicks_created_at_idx on public.whatsapp_clicks (created_at desc);
create index whatsapp_clicks_product_idx on public.whatsapp_clicks (product_id);

-- Configurações do site -------------------------------------------------------

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();
