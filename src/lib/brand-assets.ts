/**
 * Arquivos oficiais da marca.
 *
 * Nenhum símbolo foi criado para a La Belle Essence: enquanto os caminhos abaixo
 * forem `null`, o site usa um wordmark tipográfico provisório. Para aplicar o
 * logotipo oficial:
 *
 *   1. coloque os arquivos em `public/images/brand/`
 *      — `logo-claro.svg`  → versão para fundos ESCUROS (rodapé, faixa de campanha)
 *      — `logo-escuro.svg` → versão para fundos CLAROS (header, painel)
 *   2. preencha os caminhos aqui e ajuste `aspectRatio` (largura ÷ altura)
 *      com a proporção real do arquivo, para preservar o desenho da marca.
 *
 * Se o arquivo oficial já traz fundo próprio (como o selo rosé com a marca em
 * dourado), o MESMO caminho pode ir nos dois campos — ele funciona sobre claro
 * e sobre escuro. Nesse caso prefira PNG/SVG com margem interna já embutida.
 *
 * A marca não deve ser redesenhada, recortada ou distorcida.
 */
export const brandLogo: {
  onDark: string | null;
  onLight: string | null;
  aspectRatio: number;
} = {
  onDark: null,
  onLight: null,
  aspectRatio: 4.5,
};

/**
 * Mídia da hero.
 *
 * Os arquivos não acompanham o repositório. Enquanto os caminhos forem `null`,
 * a hero não pede nada à rede — assim o console fica limpo em vez de acumular
 * 404 de arquivos que ainda não existem.
 *
 * Depois de colocar os arquivos em `public/` (especificações em
 * `public/videos/README.md`), troque `null` pelos caminhos abaixo:
 *
 *   videoDesktop: "/videos/hero-desktop.mp4",
 *   videoMobile:  "/videos/hero-mobile.mp4",
 *   poster:       "/images/hero-poster.webp",
 *
 * O poster pode ser preenchido sozinho, sem os vídeos.
 *
 * As versões mobile usam um recorte EM PÉ do mesmo material. Numa tela de
 * celular, um quadro deitado precisaria ser ampliado quase o dobro para
 * preencher a altura — é daí que vem a sensação de imagem quebrada.
 */
export const heroMedia: {
  videoDesktop: string | null;
  videoMobile: string | null;
  poster: string | null;
  posterMobile: string | null;
} = {
  videoDesktop: "/videos/hero-desktop.mp4",
  videoMobile: "/videos/hero-mobile.mp4",
  poster: "/images/hero-poster.webp",
  posterMobile: "/images/hero-poster-mobile.webp",
};

/**
 * Fotografia de cada universo olfativo. Enquanto for `null`, o site usa uma
 * composição tipográfica. Para aplicar as fotos da loja, coloque os arquivos em
 * `public/images/universos/` e preencha os caminhos abaixo.
 *
 * Formato sugerido: 1200 × 1500 px (4:5), WebP ou AVIF.
 */
export const universeImages: Record<"feminino" | "masculino" | "unissex", string | null> = {
  feminino: null,
  masculino: null,
  unissex: null,
};
