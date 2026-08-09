-- ---------------------------------------------------------------------------
-- Ofertas por tempo, e limpeza dos campos que saíram do painel
--
-- A promoção continua nascendo do preço: a variante precisa ter
-- `compare_at_price_cents` maior que `price_cents`. O que entra aqui é a
-- JANELA em que essa promoção vale.
--
-- Regras das duas colunas novas:
--   • ambas nulas  → oferta sem prazo, vale enquanto o preço anterior existir;
--   • só o fim     → vale até a data marcada;
--   • só o início  → passa a valer a partir da data marcada;
--   • as duas      → vale no intervalo.
--
-- ATENÇÃO: este script REMOVE as colunas `seo_title`, `seo_description` e
-- `sku`, que saíram do formulário de produto. Se você tiver algum valor
-- guardado nelas, exporte antes — a remoção não tem volta.
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists offer_starts_at timestamptz,
  add column if not exists offer_ends_at timestamptz;

comment on column public.products.offer_starts_at is
  'Início da janela de oferta. Nulo = já vale.';
comment on column public.products.offer_ends_at is
  'Fim da janela de oferta. Nulo = sem prazo.';

-- Uma janela invertida seria uma oferta que nunca acontece.
alter table public.products
  add constraint products_offer_window_order
  check (
    offer_starts_at is null
    or offer_ends_at is null
    or offer_ends_at > offer_starts_at
  );

-- Acelera a listagem de ofertas com prazo no painel.
create index if not exists products_offer_window_idx
  on public.products (offer_ends_at)
  where offer_ends_at is not null and deleted_at is null;

-- Campos removidos do painel ---------------------------------------------------

alter table public.products
  drop column if exists seo_title,
  drop column if exists seo_description;

alter table public.product_variants
  drop column if exists sku;
