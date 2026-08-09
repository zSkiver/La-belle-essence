-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Regra geral:
--   • leitura pública apenas de produtos ativos e não excluídos;
--   • qualquer escrita exige um administrador autenticado (public.is_admin());
--   • whatsapp_clicks aceita INSERT anônimo (métrica), mas leitura só de admin.
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.olfactory_notes enable row level security;
alter table public.whatsapp_clicks enable row level security;
alter table public.site_settings enable row level security;

-- admin_users -----------------------------------------------------------------
-- Um administrador enxerga a própria linha (usado para confirmar o acesso após
-- o login). Não há policy de INSERT/UPDATE/DELETE: promover alguém a
-- administrador só é possível pelo Supabase Studio ou com a service role key.

create policy "admin_users_select_self"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

-- products --------------------------------------------------------------------

create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (is_active and deleted_at is null);

create policy "products_admin_read"
  on public.products for select
  to authenticated
  using (public.is_admin());

create policy "products_admin_insert"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

create policy "products_admin_update"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_admin_delete"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- Tabelas filhas ---------------------------------------------------------------
-- A visibilidade acompanha o produto pai.

create policy "product_variants_public_read"
  on public.product_variants for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active and p.deleted_at is null
    )
  );

create policy "product_variants_admin_all"
  on public.product_variants for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_images_public_read"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active and p.deleted_at is null
    )
  );

create policy "product_images_admin_all"
  on public.product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "olfactory_notes_public_read"
  on public.olfactory_notes for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active and p.deleted_at is null
    )
  );

create policy "olfactory_notes_admin_all"
  on public.olfactory_notes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- whatsapp_clicks --------------------------------------------------------------
-- O site registra o clique antes de abrir o WhatsApp; o visitante é anônimo.
-- Nenhum dado pessoal é gravado — apenas contexto de navegação.

create policy "whatsapp_clicks_public_insert"
  on public.whatsapp_clicks for insert
  to anon, authenticated
  with check (true);

create policy "whatsapp_clicks_admin_read"
  on public.whatsapp_clicks for select
  to authenticated
  using (public.is_admin());

-- site_settings ----------------------------------------------------------------

create policy "site_settings_public_read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "site_settings_admin_write"
  on public.site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
