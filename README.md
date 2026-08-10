# La Belle Essence RV

Site institucional e catálogo da **La Belle Essence RV** — perfumaria árabe em Rio Verde, Goiás.

Uma landing page premium com catálogo conectado ao banco, painel administrativo protegido e
funil de atendimento pelo WhatsApp. **Não há checkout, carrinho ou pagamento on-line**: o objetivo
é apresentar as fragrâncias e levar o cliente até a conversa com a consultora.

---

## Sumário

- [Stack](#stack)
- [Direção de arte](#direção-de-arte)
- [Rodando o projeto](#rodando-o-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Configurando o Supabase](#configurando-o-supabase)
- [Criando o primeiro administrador](#criando-o-primeiro-administrador)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Trocando vídeo, poster, logotipo e imagens](#trocando-vídeo-poster-logotipo-e-imagens)
- [Editando dados da loja](#editando-dados-da-loja)
- [Vitrine de promoções](#vitrine-de-promoções)
- [Painel administrativo](#painel-administrativo)
- [Funil do WhatsApp](#funil-do-whatsapp)
- [Analytics e privacidade](#analytics-e-privacidade)
- [Testes e qualidade](#testes-e-qualidade)
- [Deploy](#deploy)
- [Pendências que dependem de material externo](#pendências-que-dependem-de-material-externo)

---

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Turbopack) |
| Linguagem | TypeScript em modo estrito (`noUncheckedIndexedAccess` incluso) |
| Estilo | Tailwind CSS v4 com design tokens em `@theme` |
| Banco, auth e arquivos | Supabase (PostgreSQL + Auth + Storage) |
| Validação | Zod 4 — as mesmas regras no cliente e no servidor |
| Testes | Vitest |
| Animação | Nenhuma biblioteca: CSS + `IntersectionObserver` + animações guiadas pelo scroll |

Não há dependência de biblioteca de componentes visuais. Diálogos usam o elemento nativo
`<dialog>`, que já entrega aprisionamento de foco, camada superior e fechamento por `Esc`.

---

## Direção de arte

Paleta clara derivada do logotipo — rosé empoeirado e dourado antigo sobre marfim quente, com
marrom para o texto. Superfícies claras dão o ar de boutique; blocos escuros entram só duas vezes
(faixa de campanha e rodapé) para criar ritmo.

Todos os valores vivem em `@theme`, em `src/app/globals.css`. Contraste verificado sobre a
superfície base (`#FAF6F2`): texto principal 14,5:1, secundário 7,7:1, terciário 4,8:1, dourado de
apoio 4,7:1 e rosé de destaque 5,2:1 — todos acima do mínimo AA.

### Movimento

| Efeito | Como é feito | Custo |
| --- | --- | --- |
| Entrada das seções | `IntersectionObserver` marca `data-revealed`; variantes `up`, `fade`, `left`, `right`, `scale`, `blur` | Sem re-render do React |
| Barra de progresso de leitura | `animation-timeline: scroll()` | Zero JavaScript |
| Parallax do poster da hero | `animation-timeline: view()` | Zero JavaScript |
| Campo de luz (aurora) | `@keyframes` em `transform`/`opacity` | Composto na GPU |
| Brilho no cartão de promoção | `@keyframes` disparado no hover do grupo | Composto na GPU |
| Faixa de marcas | `@keyframes` em `transform`, pausa no hover e no foco | Composto na GPU |
| Filete dourado sob títulos | `transform: scaleX()`, nunca `width` | Sem recálculo de layout |
| Card em dois estados | No hover a foto troca pela segunda e sobem descrição, intensidade e volumes | Só `opacity`/`transform` |

O card tem **dois estados**, no espírito das vitrines de perfumaria: em repouso mostra a foto de
frente com marca, nome, preço e ações; no hover a foto troca pela segunda imagem e aparecem a
descrição curta, a intensidade e os volumes. O segundo estado é só enfeite de ponteiro fino
(`@media (hover: hover) and (pointer: fine)`) — no toque essa informação fica abaixo da foto, então
nada depende de hover.

As quebras entre seções são degradês que nascem e morrem na superfície base (`.band-blush`,
`.band-sunken`, `.band-ink`), em vez de traços duros. O conteúdo fica sempre na faixa central, já
na cor cheia, então o contraste do texto não muda.

Tudo é desligado por `prefers-reduced-motion: reduce`, inclusive os efeitos contínuos — a faixa
de marcas, a aurora e o parallax param completamente.

---

## Rodando o projeto

```bash
npm install
cp .env.example .env.local   # no Windows: copy .env.example .env.local
npm run dev                  # http://localhost:3000
```

**O site roda sem configurar nada.** Sem as variáveis do Supabase, o catálogo cai para os dados
de demonstração em `src/data/seed-products.ts` e exibe um aviso explícito de que preços e
disponibilidade precisam ser conferidos. O painel `/admin` mostra as instruções de configuração
em vez de quebrar.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção para Cloudflare Workers (OpenNext) |
| `npm run build:next` | Build padrão do Next.js para Node/Vercel |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint (config oficial do Next + regras do projeto) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest, execução única |
| `npm run test:watch` | Vitest em modo observador |

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local`.

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recomendada | URL pública. Alimenta canonical, Open Graph, `sitemap.xml` e `robots.txt`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Para banco e painel | URL do projeto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Para banco e painel | Chave publishable/anon. Pode ir ao navegador — é protegida por RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Opcional | Usada só no servidor, para registrar cliques de WhatsApp. **Nunca** prefixe com `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET` | Opcional | Nome do bucket de imagens. Padrão: `product-images`. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Opcional | ID do Google Analytics 4. Vazio = nenhum script carregado. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Opcional | ID do Meta Pixel. Vazio = nenhum script carregado. |

Nenhum ID de analytics vem preenchido. Enquanto estiverem vazios, o site não carrega scripts de
terceiros — e por isso também não exibe banner de cookies.

---

## Configurando o Supabase

### 1. Crie o projeto

Em [supabase.com](https://supabase.com), crie um projeto e anote, em **Project Settings → API**:
a URL do projeto e a chave `anon` / publishable. Preencha as duas em `.env.local`.

### 2. Aplique as migrations

**Opção A — Supabase CLI (recomendada):**

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

**Opção B — SQL Editor:** abra o SQL Editor do painel e execute, **nesta ordem**, o conteúdo de:

1. `supabase/migrations/20260809120000_init_schema.sql` — tabelas, enums, índices e triggers
2. `supabase/migrations/20260809120100_row_level_security.sql` — políticas de RLS
3. `supabase/migrations/20260809120200_storage_product_images.sql` — bucket de imagens e políticas

### 3. (Opcional) Carregue os dados de demonstração

Execute `supabase/seed.sql`, ou pelo CLI:

```bash
supabase db reset          # atenção: recria o banco local do zero
```

> **Leia antes de usar:** o seed contém marcas e nomes de fragrância que existem no mercado, mas
> **os preços, volumes e a disponibilidade são valores de exemplo**. Nada ali representa a tabela
> de preços ou o estoque da loja. Confira e substitua tudo pelo painel antes de publicar — ou
> simplesmente não rode o seed e cadastre o acervo do zero.
>
> Para remover a demonstração depois:
> ```sql
> delete from public.products where id::text like '11111111-1111-4111-8111-%';
> ```

### O que a segurança garante

- **Leitura pública** apenas de produtos `is_active = true` e `deleted_at is null`. Variantes,
  imagens e notas herdam a visibilidade do produto.
- **Qualquer escrita** exige um usuário autenticado que conste em `admin_users` — verificado pela
  função `public.is_admin()`, que sustenta todas as políticas.
- **`whatsapp_clicks`** aceita `INSERT` anônimo (é métrica de navegação, sem dado pessoal), mas só
  administradores conseguem ler.
- **Storage**: leitura pública das fotos; envio, substituição e remoção só para administradores.
  O bucket rejeita arquivos acima de 5 MB e formatos fora de JPEG/PNG/WebP/AVIF.
- A chave `service_role` nunca chega ao navegador: não tem prefixo `NEXT_PUBLIC_` e só é lida em
  código de servidor.
- **Não existe cadastro público de administradores.** Não há política de `INSERT` em `admin_users`.

---

## Criando o primeiro administrador

O sistema não tem tela de cadastro, de propósito. O primeiro acesso é criado à mão:

1. No painel do Supabase, vá em **Authentication → Users → Add user**.
2. Informe e-mail e senha e marque **Auto Confirm User** (senão o login falha por e-mail não
   confirmado).
3. No **SQL Editor**, promova esse usuário a administrador — a consulta busca o UUID pelo e-mail,
   então não é preciso copiar nada à mão:

   ```sql
   insert into public.admin_users (user_id, display_name)
   select id, 'Nome da pessoa'
   from auth.users
   where email = 'email@da-loja.com'
   on conflict (user_id) do nothing;
   ```

4. Confira se a linha foi criada:

   ```sql
   select u.email, a.display_name, a.created_at
   from public.admin_users a
   join auth.users u on u.id = a.user_id;
   ```

5. Acesse `/admin/login` e entre com esse e-mail e senha.

Para adicionar outros administradores depois, repita os passos 1–3. Para revogar o acesso, remova
a linha de `admin_users` — a conta continua existindo, mas perde toda permissão de escrita:

```sql
delete from public.admin_users
where user_id = (select id from auth.users where email = 'email@da-loja.com');
```

### "Sem permissão" depois de entrar

Essa tela significa exatamente uma coisa: o login funcionou, mas o usuário não está em
`admin_users`. É o passo 3 acima. Depois de inserir a linha, **basta recarregar `/admin`** — a
verificação roda a cada requisição, não é preciso sair e entrar de novo.

Se o `insert` afetar **0 linhas**, o e-mail digitado não confere com o gravado no Auth. Veja qual
está lá:

```sql
select id, email, email_confirmed_at from auth.users order by created_at desc;
```

Se `email_confirmed_at` estiver `null`, o usuário foi criado sem **Auto Confirm User**: apague-o em
*Authentication → Users* e recrie marcando a opção.

**Recuperação de senha:** a tela de login tem "Esqueci minha senha", que usa
`resetPasswordForEmail` do Supabase. Para o e-mail chegar, configure um provedor SMTP em
**Project Settings → Auth → SMTP Settings**. Sem SMTP configurado, redefina a senha manualmente
pelo painel do Supabase.

---

## Estrutura do projeto

```
src/
├── app/
│   ├── page.tsx                    Landing page (estática, revalidada a cada 5 min)
│   ├── layout.tsx                  Fontes, metadata global, viewport
│   ├── politica-de-privacidade/    Página de privacidade
│   ├── api/whatsapp-click/         Registro de cliques
│   ├── admin/
│   │   ├── login/                  Tela de login (fora do guarda de sessão)
│   │   ├── actions.ts              Server Actions do CRUD
│   │   └── (painel)/               Área protegida: painel, produtos, novo, editar
│   ├── sitemap.ts · robots.ts · opengraph-image.tsx · icon.svg
│   └── globals.css                 Design tokens e utilitários editoriais
│
├── domain/          Regras de negócio puras, sem React e sem I/O
│   ├── enums.ts        Vocabulário do domínio e rótulos em pt-BR
│   ├── product.ts      Tipos do modelo
│   ├── catalog.ts      Busca, filtros, ordenação e atalhos temáticos
│   ├── promotions.ts   Desconto real a partir do preço anterior
│   ├── variants.ts     Variante padrão, menor preço, disponibilidade
│   ├── whatsapp.ts     Montagem da mensagem e da URL wa.me
│   ├── format.ts       Moeda, datas (America/Sao_Paulo) e conversão de preço
│   └── schemas.ts      Validação Zod, compartilhada entre cliente e servidor
│
├── data/            Acesso a dados
│   ├── products.ts        Catálogo público, com fallback para o seed local
│   ├── admin-products.ts  Leitura e escrita do painel
│   ├── mappers.ts         Linha do banco → modelo de domínio
│   └── seed-products.ts   Dados de demonstração
│
├── components/      Interface
│   ├── site/        Seções da landing page
│   ├── catalog/     Catálogo, filtros, card e modal de produto
│   ├── whatsapp/    Provider do funil de atendimento
│   ├── admin/       Painel: tabela, formulário, upload de imagens
│   ├── ui/          Primitivos acessíveis (botão, diálogo, toast, campos)
│   └── brand/       Wordmark
│
├── lib/             Infraestrutura
│   ├── site-config.ts     Endereços, WhatsApp, redes, horários
│   ├── brand-assets.ts    Caminhos de logotipo, vídeo e fotos de categoria
│   ├── supabase/          Clientes (browser, servidor, público, service role)
│   └── analytics.ts       Eventos e captura de UTM
│
└── proxy.ts         Renova a sessão e barra /admin sem autenticação
```

A separação é intencional: `domain/` não importa React nem Supabase, e é onde vivem os testes.
`data/` é a única camada que fala com o banco. `components/` não contém regra de negócio.

---

## Trocando vídeo, poster, logotipo e imagens

### Vídeo da hero

Coloque os arquivos em `public/videos/` (veja `public/videos/README.md` para os comandos de
compressão prontos):

| Arquivo | Quando é usado | Alvo |
| --- | --- | --- |
| `hero-desktop.mp4` | a partir de 768 px | 1920 × 1080, H.264, ~8 s, até 3 MB |
| `hero-mobile.mp4` | até 767 px | 1080 × 1350, H.264, ~8 s, até 1,5 MB |
| `../images/hero-poster.webp` | poster estático | 1920 × 1080, WebP, até 200 KB |

Depois de subir os arquivos, preencha os caminhos em `src/lib/brand-assets.ts` (`heroMedia`).
Enquanto forem `null`, a hero não faz nenhuma requisição de mídia — é o que mantém o console
limpo, sem 404 de arquivos inexistentes. O poster pode ser ativado sozinho, sem os vídeos.

Direção: close de frasco, vidro, âmbar, fumaça delicada, tecido, reflexos dourados ou líquido em
movimento lento. **Sem texto embutido** e sem áudio.

A hero foi construída em camadas para não depender desses arquivos: o fundo em gradiente é sempre
renderizado, o poster entra quando carrega e o vídeo entra por cima quando estiver disponível.
**Enquanto os arquivos não existirem, a seção continua completa e elegante.** O texto é renderizado
no servidor, então o LCP não espera a mídia. Quem usa `prefers-reduced-motion: reduce` nunca recebe
o vídeo — só o poster.

> Use apenas material próprio ou com licença comercial confirmada. O site não aponta para vídeo
> hospedado em outro domínio.

### Logotipo

Nenhum símbolo foi criado para a marca. O site usa um **wordmark tipográfico provisório**.

Para aplicar o logotipo oficial:

1. coloque os arquivos em `public/images/brand/`:
   - `logo-claro.svg` → versão para fundos **escuros** (site público)
   - `logo-escuro.svg` → versão para fundos **claros** (painel administrativo)
2. preencha os caminhos em `src/lib/brand-assets.ts` (`brandLogo.onDark` e `brandLogo.onLight`);
3. ajuste `brandLogo.aspectRatio` (largura ÷ altura) com a proporção **real** do arquivo, para que
   o desenho não seja distorcido.

O favicon provisório é `src/app/icon.svg` — substitua por um arquivo derivado da marca oficial.

### Fotos das categorias

Coloque as três fotos em `public/images/universos/` (1200 × 1500, WebP ou AVIF) e preencha
`universeImages` em `src/lib/brand-assets.ts`. Sem elas, o site usa composições tipográficas com
arco — nada fica quebrado.

### Fotos de produto

Não vão para o repositório: são enviadas pelo painel `/admin` e ficam no Supabase Storage.
Produto sem foto aparece com um marcador tipográfico (inicial do nome e marca), não com um
espaço vazio.

---

## Editando dados da loja

Tudo que a loja costuma trocar está em **`src/lib/site-config.ts`**: nomes, endereços completos,
números de WhatsApp, Instagram, links de mapa, quantidade de destaques e itens por página.

Dois campos vêm propositalmente vazios, porque não havia informação confirmada:

```ts
openingHours: null   // horário de funcionamento — o rodapé omite o bloco enquanto for null
testimonials: []     // depoimentos — a seção não é renderizada enquanto estiver vazia
```

Ambos têm exemplo de preenchimento comentado no arquivo. **Preencha apenas com informação real:**
o site foi construído para omitir em vez de inventar.

---

## Vitrine de promoções

Não existe um botão "colocar em promoção". Uma promoção é um **fato do preço**: a variante tem um
**preço anterior maior que o preço atual**. É só isso que aciona a vitrine — assim o percentual
exibido é sempre verdadeiro e nunca vira enfeite.

### Como colocar um perfume em promoção

São duas decisões, em dois lugares — de propósito:

1. **O desconto** (em `/admin/produtos` → editar): no volume desejado, preencha
   **Preço anterior (R$)** com o valor de antes. O percentual é calculado sozinho.
2. **O prazo** (em `/admin/destaques`): defina quando a oferta começa e termina, ou use os
   atalhos de 24 horas, 3 dias e 7 dias. Sem prazo, a oferta vale enquanto o preço anterior
   existir.

O formulário e o banco recusam preço anterior menor ou igual ao atual, então não é possível
cadastrar um "desconto" que não existe. E fora da janela, a promoção some do site sozinha —
ninguém precisa lembrar de desligar.

### A aba Destaques e ofertas

`/admin/destaques` reúne as duas decisões de vitrine numa tela só:

| Recurso | O que faz |
| --- | --- |
| Abas | Filtra por preço promocional, em destaque, ou todos |
| Situação | Mostra se a oferta está **ativa**, **agendada**, **encerrada** ou inexistente |
| Atalhos de prazo | 24 h, 3 dias, 7 dias ou sem prazo, em um clique |
| Datas | Início e fim, no horário local da loja |
| Destaque | Liga e desliga a presença na vitrine da home |

Perfumes sem preço promocional aparecem com um aviso e um atalho para editar os preços — a tela
explica por que a oferta ainda não existe, em vez de só deixar o campo inerte.

### O que acontece quando há promoção

| Onde | O que aparece |
| --- | --- |
| Barra do topo | Troca para "Promoções ativas • até X% de desconto" e vira atalho |
| Menu | Ganha o item **Promoções** |
| Vitrine `#promocoes` | Seção própria em fundo rosé, do maior para o menor desconto, com as ofertas passando sozinhas a cada 6 s |
| Contagem regressiva | Nos cards com prazo: "restam 2 dias", "restam 5 h 20 min" |
| Card do produto | Selo `−X%`, preço com desconto e preço anterior riscado |
| Modal | Selo no volume em promoção e destaque no preço |
| Catálogo | Atalho **Promoções** e caixa "Somente perfumes em promoção" |
| Painel | Cartão "Em promoção" e filtro "Somente promoções" na tabela |

**Sem nenhum desconto cadastrado, nada disso aparece** — a vitrine não é renderizada, o item some
do menu e a barra do topo volta à mensagem padrão. É o comportamento correto, não uma falha.

Variante esgotada nunca entra na vitrine: anunciar desconto no que não pode ser pedido seria
enganoso.

### Vitrine vazia com o Supabase conectado?

Se o banco foi populado com `supabase/seed.sql` antes desta versão, todas as linhas estão com
`compare_at_price_cents` nulo — e o script usa `on conflict do nothing`, então rodar de novo não
atualiza. Para aplicar os descontos de demonstração nas linhas que já existem:

```sql
update public.product_variants set compare_at_price_cents = 52990
where product_id = '11111111-1111-4111-8111-000000000001' and size_ml = 100;

update public.product_variants set compare_at_price_cents = 33990
where product_id = '11111111-1111-4111-8111-000000000002' and size_ml = 100;

update public.product_variants set compare_at_price_cents = 44990
where product_id = '11111111-1111-4111-8111-000000000003' and size_ml = 105;

update public.product_variants set compare_at_price_cents = 64990
where product_id = '11111111-1111-4111-8111-000000000006' and size_ml = 50;
```

Lembre que esses valores são **exemplo**. Em produção, use o painel com os preços reais da loja.

A home é revalidada a cada 5 minutos, então a vitrine aparece no máximo 5 minutos depois — ou
imediatamente, se a alteração vier pelo painel (as Server Actions revalidam na hora).

---

## Painel administrativo

Disponível em `/admin`, protegido em duas camadas: `src/proxy.ts` barra quem não tem sessão, e o
layout de `(painel)` confirma no banco que o usuário é administrador.

| Rota | O que faz |
| --- | --- |
| `/admin/login` | Login e recuperação de senha |
| `/admin` | Totais de produtos, ativos, sem volume, destaques e cliques dos últimos 30 dias |
| `/admin/produtos` | Tabela com busca, filtro por status e ordenação |
| `/admin/produtos/novo` | Cadastro |
| `/admin/produtos/[id]/editar` | Edição |
| `/admin/destaques` | Destaques da home e ofertas por tempo |

Cada produto tem nome, slug (gerado do nome e editável), marca, descrição curta e completa,
gênero, família olfativa, concentração, ocasião, selo, ordem de exibição, pirâmide olfativa nos
três níveis, imagens e **uma ou mais variantes de volume** — cada uma com preço, preço anterior
opcional e disponibilidade.

Ações da tabela: editar, ativar/desativar, marcar destaque, **duplicar** (a cópia nasce inativa,
para ser revisada antes de publicar) e **excluir com confirmação**.

**A exclusão é lógica** (`deleted_at`): o produto some do site na hora, mas o registro permanece
para que os cliques de WhatsApp já contabilizados continuem válidos. Pelo mesmo motivo, editar um
produto **atualiza** as variantes existentes em vez de recriá-las — recriar quebraria o vínculo
das métricas.

Imagens vão direto do navegador para o Storage (o servidor não intermedeia o binário), com nome
único por arquivo. Ao salvar, as fotos removidas são apagadas do Storage junto com a linha.

Preços são sempre armazenados como **inteiros em centavos**. O formulário aceita o formato
brasileiro (`289,90`, `R$ 289,90`, `1.899,90`).

---

## Funil do WhatsApp

Não há carrinho nem checkout. Ao clicar em "Quero este perfume", abre-se um diálogo que:

1. pede a **escolha do volume**, quando há mais de um (variantes esgotadas ficam desabilitadas);
2. pede a **unidade de atendimento** — Buriti Shopping ou Centro;
3. registra o clique em `whatsapp_clicks` (produto, variante, unidade, origem, UTMs, referrer);
4. abre `wa.me` **no número da unidade escolhida**, com a mensagem já codificada.

Modelo da mensagem:

> Olá! Vim pelo site da La Belle Essence e tenho interesse no perfume **[NOME]**, da **[MARCA]**,
> na versão **[VOLUME]**, por **[PREÇO]**. Gostaria de confirmar a disponibilidade para
> atendimento na unidade **[UNIDADE]**.

A mensagem **pede confirmação de disponibilidade** — nunca afirma que o produto está reservado ou
em estoque. Isso só a loja pode confirmar. Variantes marcadas como esgotadas não permitem abrir a
conversa como se estivessem disponíveis.

A última unidade escolhida é lembrada no `localStorage`, apenas para vir pré-marcada; o usuário
pode trocar em qualquer clique.

Os cliques são separados por origem — `hero`, `header`, `product_card`, `product_modal`,
`floating_button`, `final_cta`, `unit_section` —, o que permite ver de onde vem o interesse.
Parâmetros UTM da URL são capturados na primeira visita da sessão e viajam junto com o registro.

A janela do WhatsApp abre **dentro do gesto do usuário**, antes de qualquer espera de rede, para
não ser bloqueada por bloqueadores de pop-up. O registro da métrica acontece em paralelo e, se
falhar, o atendimento segue normalmente.

---

## Analytics e privacidade

`trackEvent` dispara para `gtag` e `fbq` quando existirem. Sem IDs configurados, **nenhum script
de terceiros é carregado** e as funções não fazem nada — nenhum ID falso foi colocado no código.

`/politica-de-privacidade` explica em linguagem direta o atendimento por WhatsApp, o que é
registrado nas métricas (e o que **não** é: nada de IP, nome ou telefone), a preferência de
unidade no `localStorage` e os UTMs no `sessionStorage`. A página se adapta sozinha: o texto sobre
ferramentas de análise muda conforme haja ou não IDs configurados.

Como o site público não usa cookies de rastreamento, **não há banner de cookies** — ele seria
ruído sem função. Se a loja passar a usar analytics, a seção correspondente já se ajusta, mas
revise o texto antes.

---

## Testes e qualidade

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

A suíte cobre as regras que quebram o negócio se derem errado:

| Arquivo | Cobre |
| --- | --- |
| `tests/whatsapp.test.ts` | Mensagem com nome, marca, volume, preço e unidade; número correto por unidade; codificação da URL; ausência de promessa de estoque |
| `tests/variants.test.ts` | Ordenação, rótulo, variante padrão (pula esgotadas), menor/maior preço, disponibilidade |
| `tests/format.test.ts` | `Intl.NumberFormat` em BRL, parsing do formato brasileiro, datas em `America/Sao_Paulo` |
| `tests/catalog.test.ts` | Busca sem acento, filtros combinados, faixa de preço, as quatro ordenações, filtro de promoção e selo, atalhos temáticos |
| `tests/promotions.test.ts` | Cálculo do desconto, maior desconto do produto, exclusão de variante esgotada, ordenação da vitrine, janela de oferta (agendada/ativa/encerrada) e contagem regressiva |
| `tests/schemas.test.ts` | Validação do formulário de produto e das variantes, limites de imagem |

Padrões seguidos: TypeScript estrito sem `any`, sem código morto, sem `console.log` (proibido por
lint), mensagens de interface em português do Brasil, moeda com `Intl.NumberFormat` e datas no
fuso `America/Sao_Paulo`.

### Acessibilidade

Navegação completa por teclado, foco sempre visível, alvos de toque de no mínimo 44 px, diálogos
com `<dialog>` nativo (foco preso, `Esc`, clique externo), rótulos associados a todos os campos,
`aria-live` na contagem de resultados, link "pular para o catálogo" e respeito a
`prefers-reduced-motion` — que desliga o vídeo e as animações de entrada.

### Performance

Página inicial estática com revalidação a cada 5 minutos. As seções editoriais continuam sendo
Server Components: os providers de estado recebem o conteúdo por `children`, então essas seções
não entram no bundle do cliente. Imagens em AVIF/WebP com dimensões explícitas para evitar CLS.
O vídeo usa `preload="none"` e só é montado no cliente, sem competir com o LCP.

O movimento foi construído para não custar quadros: a barra de progresso e o parallax usam
animações guiadas pelo scroll (sem JavaScript), o resto anima só `transform`, `opacity` e `filter`
— nunca propriedades que provocam recálculo de layout.

Rode o Lighthouse **contra o build de produção** (`npm run build && npm run start`) — o modo de
desenvolvimento sempre reporta números piores.

---

## Deploy

### Cloudflare Workers

O projeto usa o adaptador OpenNext. Em **Settings → Build**, configure:

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`

Cadastre as variáveis `NEXT_PUBLIC_*` em **Build Variables and secrets** e as
variáveis de runtime em **Variables and Secrets**. A
`SUPABASE_SERVICE_ROLE_KEY` deve ser cadastrada como secret.

O middleware administrativo permanece em `src/middleware.ts` para usar o
runtime Edge. Enquanto o OpenNext não suportar Node.js Middleware, não migre
esse arquivo para `src/proxy.ts`.

### Vercel (caminho mais curto)

1. Suba o repositório para o GitHub e importe o projeto na Vercel.
2. Em **Settings → Environment Variables**, cadastre todas as variáveis de `.env.example`.
   Marque `SUPABASE_SERVICE_ROLE_KEY` como sensível e **não** a exponha como `NEXT_PUBLIC_`.
3. Defina `NEXT_PUBLIC_SITE_URL` com o domínio final — canonical, Open Graph e sitemap dependem dela.
4. Configure o comando de build como `npm run build:next` e faça o deploy.

### Qualquer host com Node

```bash
npm ci
npm run build:next
npm run start        # porta 3000 por padrão
```

Requer Node 20.9 ou superior.

### Depois de publicar

- Confirme que `https://SEU-DOMINIO/robots.txt` e `/sitemap.xml` respondem com a URL correta.
- Cadastre o site no Google Search Console e envie o sitemap.
- Teste o funil ponta a ponta em um celular real: escolher volume, escolher unidade e verificar se
  a conversa abre **no número certo** com a mensagem completa.
- Confira em `/admin` se os cliques estão sendo registrados.

---

## Pendências que dependem de material externo

Estes itens não dependem de código — precisam de material ou informação da loja:

| Pendência | Onde entra | Sem isso, o que acontece |
| --- | --- | --- |
| **Vídeo da hero** (desktop e mobile) + poster | `public/videos/` e `public/images/`, depois `heroMedia` em `src/lib/brand-assets.ts` | A hero mostra o fundo em gradiente. Funciona, mas sem o efeito cinematográfico. |
| **Logotipo oficial** (versões clara e escura) | `public/images/brand/` + `src/lib/brand-assets.ts` | Wordmark tipográfico provisório. |
| **Favicon derivado da marca** | `src/app/icon.svg` | Ícone provisório com monograma. |
| **Fotos das três categorias** | `public/images/universos/` | Composição tipográfica com arco. |
| **Fotos dos produtos** | Painel `/admin` | Marcador com a inicial do perfume. |
| **Credenciais do Supabase** | `.env.local` | Catálogo de demonstração e painel indisponível. |
| **Horário de funcionamento confirmado** | `siteConfig.openingHours` | O rodapé e o JSON-LD omitem o horário. |
| **Depoimentos reais e autorizados** | `siteConfig.testimonials` | A seção não é renderizada. |
| **Preços e disponibilidade reais** | Painel `/admin` | Vale o aviso de dados de demonstração exibido no catálogo. |
| **Coordenadas das lojas** (opcional) | `siteConfig.units[].geo` | O JSON-LD omite `geo`; o botão "Como chegar" continua funcionando por busca de endereço. |
| **IDs de analytics** (opcional) | `.env.local` | Nenhum script de terceiros é carregado. |
| **SMTP no Supabase** (opcional) | Painel do Supabase | "Esqueci minha senha" não envia e-mail; redefina pelo painel. |

Nenhum desses itens impede o projeto de instalar, compilar, passar nos testes e rodar.
