# Imagens estáticas

Fotografias de produto **não** ficam aqui: elas são enviadas pelo painel `/admin` e
armazenadas no Supabase Storage. Esta pasta guarda apenas a arte fixa do site.

| Arquivo | Usado em | Especificação |
| --- | --- | --- |
| `hero-poster.webp` | poster do vídeo da hero | 1920 × 1080, WebP, até 200 KB |
| `brand/logo-claro.svg` | logotipo sobre fundo escuro (site) | SVG preferencialmente |
| `brand/logo-escuro.svg` | logotipo sobre fundo claro (painel) | SVG preferencialmente |
| `universos/feminino.webp` | card do universo Feminino | 1200 × 1500 (4:5) |
| `universos/masculino.webp` | card do universo Masculino | 1200 × 1500 (4:5) |
| `universos/unissex.webp` | card do universo Unissex | 1200 × 1500 (4:5) |

Depois de adicionar os arquivos, preencha os caminhos em `src/lib/brand-assets.ts`
(`brandLogo` e `universeImages`). Enquanto estiverem `null`, o site usa composições
tipográficas próprias — nada fica quebrado.

## Logotipo

Não redesenhe a marca. Ao aplicar o arquivo oficial, ajuste `brandLogo.aspectRatio`
(largura ÷ altura) com a proporção real, para que o desenho não seja distorcido.

O favicon provisório é `src/app/icon.svg` — substitua por um arquivo derivado da marca
oficial quando ele existir.
