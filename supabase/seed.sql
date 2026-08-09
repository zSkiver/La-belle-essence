-- ---------------------------------------------------------------------------
-- DADOS INICIAIS DE DEMONSTRAÇÃO
--
-- Espelha `src/data/seed-products.ts`.
--
-- ATENÇÃO: marcas e nomes de fragrância são referências públicas do segmento,
-- mas PREÇOS, VOLUMES E DISPONIBILIDADE SÃO VALORES DE EXEMPLO. Nada aqui
-- representa estoque ou tabela de preços real. Confira e substitua tudo pelo
-- painel administrativo antes de publicar o site.
--
-- O script é idempotente: pode ser executado novamente sem duplicar linhas.
-- Para remover toda a demonstração:
--   delete from public.products where id::text like '11111111-1111-4111-8111-%';
-- ---------------------------------------------------------------------------

insert into public.products
  (id, name, slug, brand, short_description, description, gender, fragrance_family,
   concentration, occasion, badge, is_featured, is_active, sort_order, created_at)
values
  ('11111111-1111-4111-8111-000000000001', 'Khamrah', 'khamrah', 'Lattafa',
   'Especiarias quentes e baunilha cremosa em um rastro envolvente.',
   'Uma composição doce e especiada que abre com canela e noz-moscada e evolui para tâmaras, praliné e baunilha. Marca presença em ambientes fechados e no fim de tarde.',
   'unissex', 'gourmand', 'edp', 'Noite e encontros', 'mais_vendido', true, true, 0, now() - interval '0 day'),

  ('11111111-1111-4111-8111-000000000002', 'Yara', 'yara', 'Lattafa',
   'Floral frutado leitoso, doce sem ser pesado.',
   'Orquídea e heliotrópio sobre um fundo cremoso de sândalo e baunilha. Um perfume feminino de uso fácil, que acompanha bem o dia inteiro.',
   'feminino', 'floral', 'edp', 'Dia a dia', null, true, true, 1, now() - interval '1 day'),

  ('11111111-1111-4111-8111-000000000003', 'Club de Nuit Intense Man', 'club-de-nuit-intense-man', 'Armaf',
   'Abertura cítrica e fumê sobre um fundo amadeirado marcante.',
   'Limão e abacaxi abrem a composição, que se assenta em bétula, almíscar e baunilha. Projeção generosa e assinatura reconhecível.',
   'masculino', 'amadeirado', 'edt', 'Trabalho e noite', 'mais_vendido', true, true, 2, now() - interval '2 day'),

  ('11111111-1111-4111-8111-000000000004', 'Amber Oud Gold Edition', 'amber-oud-gold-edition', 'Al Haramain',
   'Âmbar e oud dourados, com frescor cítrico na abertura.',
   'Um oriental contemporâneo: bergamota e maçã dão leveza à entrada, e o fundo de âmbar, oud e almíscar sustenta o rastro por horas.',
   'unissex', 'oriental', 'edp', 'Ocasiões especiais', null, true, true, 3, now() - interval '3 day'),

  ('11111111-1111-4111-8111-000000000005', 'Hawas for Him', 'hawas-for-him', 'Rasasi',
   'Frescor aquático e frutado para o calor do Centro-Oeste.',
   'Maçã, canela e bergamota em uma abertura viva, com fundo de âmbar cinzento e almíscar. Escolha natural para o dia e para climas quentes.',
   'masculino', 'fresco', 'edp', 'Dia e clima quente', null, false, true, 4, now() - interval '4 day'),

  ('11111111-1111-4111-8111-000000000006', 'Shaghaf Oud', 'shaghaf-oud', 'Swiss Arabian',
   'Oud, rosa e açafrão — perfumaria árabe no seu registro clássico.',
   'Um oriental denso construído sobre oud e rosa, com açafrão na abertura e baunilha no fundo. Pouca quantidade já é suficiente.',
   'unissex', 'oriental', 'edp', 'Noite', 'destaque', true, true, 5, now() - interval '5 day'),

  ('11111111-1111-4111-8111-000000000007', '9 PM', '9-pm', 'Afnan',
   'Maçã, canela e baunilha para a noite.',
   'Doce e especiado, com abertura de maçã e lavanda e fundo de baunilha e fava tonka. Um gourmand masculino de uso simples.',
   'masculino', 'gourmand', 'edp', 'Noite', null, false, true, 6, now() - interval '6 day'),

  ('11111111-1111-4111-8111-000000000008', 'Asad', 'asad', 'Lattafa',
   'Abacaxi, tabaco e baunilha em um amadeirado escuro.',
   'Abertura frutada que rapidamente cede lugar a tabaco, canela e baunilha. Rastro quente, indicado para as horas mais frescas do dia.',
   'masculino', 'amadeirado', 'edp', 'Noite e clima ameno', 'lancamento', false, true, 7, now() - interval '7 day')
on conflict (id) do nothing;

-- Variantes de volume ---------------------------------------------------------

-- `compare_at_price_cents` maior que o preço atual = promoção ativa. É esse
-- campo, e só ele, que alimenta a vitrine de promoções do site.
insert into public.product_variants
  (product_id, size_ml, price_cents, compare_at_price_cents, availability_status, sort_order)
values
  ('11111111-1111-4111-8111-000000000001', 30,  19990, null,  'disponivel', 0),
  ('11111111-1111-4111-8111-000000000001', 100, 42990, 52990, 'disponivel', 1),
  ('11111111-1111-4111-8111-000000000002', 100, 28990, 33990, 'disponivel', 0),
  ('11111111-1111-4111-8111-000000000003', 30,  17990, null,  'disponivel', 0),
  ('11111111-1111-4111-8111-000000000003', 105, 36990, 44990, 'disponivel', 1),
  ('11111111-1111-4111-8111-000000000004', 60,  54990, null,  'disponivel', 0),
  ('11111111-1111-4111-8111-000000000004', 120, 89990, null,  'sob_encomenda', 1),
  ('11111111-1111-4111-8111-000000000005', 100, 46990, null,  'disponivel', 0),
  ('11111111-1111-4111-8111-000000000006', 50,  52990, 64990, 'disponivel', 0),
  ('11111111-1111-4111-8111-000000000006', 75,  68990, null,  'ultimas_unidades', 1),
  ('11111111-1111-4111-8111-000000000007', 100, 33990, null,  'disponivel', 0),
  ('11111111-1111-4111-8111-000000000008', 100, 31990, null,  'disponivel', 0)
on conflict do nothing;

-- Pirâmide olfativa -----------------------------------------------------------

insert into public.olfactory_notes (product_id, level, notes, sort_order)
values
  ('11111111-1111-4111-8111-000000000001', 'top',   array['Canela','Noz-moscada','Bergamota'], 0),
  ('11111111-1111-4111-8111-000000000001', 'heart', array['Tâmara','Praliné','Tuberosa'], 1),
  ('11111111-1111-4111-8111-000000000001', 'base',  array['Baunilha','Fava tonka','Âmbar','Benjoim'], 2),

  ('11111111-1111-4111-8111-000000000002', 'top',   array['Orquídea','Tangerina'], 0),
  ('11111111-1111-4111-8111-000000000002', 'heart', array['Heliotrópio','Gardênia'], 1),
  ('11111111-1111-4111-8111-000000000002', 'base',  array['Sândalo','Baunilha','Almíscar'], 2),

  ('11111111-1111-4111-8111-000000000003', 'top',   array['Limão','Abacaxi','Bergamota','Maçã'], 0),
  ('11111111-1111-4111-8111-000000000003', 'heart', array['Bétula','Jasmim','Rosa'], 1),
  ('11111111-1111-4111-8111-000000000003', 'base',  array['Almíscar','Baunilha','Âmbar','Patchouli'], 2),

  ('11111111-1111-4111-8111-000000000004', 'top',   array['Bergamota','Maçã','Limão'], 0),
  ('11111111-1111-4111-8111-000000000004', 'heart', array['Lavanda','Gerânio'], 1),
  ('11111111-1111-4111-8111-000000000004', 'base',  array['Âmbar','Oud','Almíscar','Baunilha'], 2),

  ('11111111-1111-4111-8111-000000000005', 'top',   array['Maçã','Bergamota','Canela'], 0),
  ('11111111-1111-4111-8111-000000000005', 'heart', array['Jasmim','Notas aquáticas','Magnólia'], 1),
  ('11111111-1111-4111-8111-000000000005', 'base',  array['Âmbar cinzento','Almíscar','Cedro'], 2),

  ('11111111-1111-4111-8111-000000000006', 'top',   array['Açafrão','Notas frutadas'], 0),
  ('11111111-1111-4111-8111-000000000006', 'heart', array['Rosa','Oud'], 1),
  ('11111111-1111-4111-8111-000000000006', 'base',  array['Baunilha','Âmbar','Almíscar'], 2),

  ('11111111-1111-4111-8111-000000000007', 'top',   array['Maçã','Lavanda','Bergamota'], 0),
  ('11111111-1111-4111-8111-000000000007', 'heart', array['Canela','Íris'], 1),
  ('11111111-1111-4111-8111-000000000007', 'base',  array['Baunilha','Fava tonka','Âmbar'], 2),

  ('11111111-1111-4111-8111-000000000008', 'top',   array['Abacaxi','Bergamota','Pimenta'], 0),
  ('11111111-1111-4111-8111-000000000008', 'heart', array['Tabaco','Canela','Gerânio'], 1),
  ('11111111-1111-4111-8111-000000000008', 'base',  array['Baunilha','Fava tonka','Cedro','Almíscar'], 2)
on conflict (product_id, level) do nothing;

-- Nenhuma imagem é semeada: o site usa um marcador tipográfico enquanto não
-- houver fotografia própria licenciada. Envie as fotos pelo painel /admin.
