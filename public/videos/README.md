# Vídeo da hero

**Estado atual:** os arquivos abaixo já estão gerados e ligados em
`src/lib/brand-assets.ts`. Eles foram derivados de
`Perfume_bottle_cap_animation_202608091915.mp4`, que continua aqui como fonte —
esse original **não é usado pelo site** e pode ser removido da pasta `public/`
(tudo em `public/` vai junto no deploy, e ele são ~4 MB parados).

| Arquivo | Dimensões | Tamanho |
| --- | --- | --- |
| `hero-desktop.mp4` | 1280 × 720 | 1,2 MB |
| `hero-mobile.mp4` | 404 × 720 (recorte em pé) | 884 KB |
| `../images/hero-poster.webp` | 1280 × 720 | 55 KB |
| `../images/hero-poster-mobile.webp` | 404 × 720 | 56 KB |

> **A versão mobile é um recorte EM PÉ, não o mesmo quadro reduzido.** Num
> celular, o painel da hero é alto e estreito; um quadro deitado teria de ser
> ampliado quase o dobro para preencher a altura, e é daí que vem a sensação de
> imagem quebrada. O recorte 9:16 corta a ampliação de ~6,2× para ~3,5×.

> **Importante — o vídeo é percorrido pela rolagem.** A hero não reproduz o
> vídeo em loop: ela usa a posição da rolagem como linha do tempo, avançando
> quadro a quadro. Para o `seek` ser barato, os arquivos são codificados com
> **keyframe a cada 6 quadros** (`-g 6 -keyint_min 6 -sc_threshold 0`).
>
> Por isso eles pesam mais que um vídeo comum: sem keyframes frequentes, o
> navegador precisa decodificar desde o keyframe anterior a cada busca e a
> rolagem engasga. Se regerar sem essas opções, o efeito trava.

Para regerar a partir de um vídeo novo, use os comandos do fim deste arquivo.

---

Coloque aqui os dois arquivos usados pela primeira seção do site:

| Arquivo | Quando é usado | Especificação sugerida |
| --- | --- | --- |
| `hero-desktop.mp4` | telas a partir de 768 px | 1280 × 720 (16:9), H.264, 4 a 8 s, **até 3 MB** |
| `hero-mobile.mp4` | telas até 767 px | recorte 9:16 do mesmo material, **até 1,5 MB** |

O poster estático vai em `public/images/hero-poster.webp` (1920 × 1080, WebP, até 200 KB).
Ele deve ser **um quadro do próprio vídeo**, para que a transição não “pule”.

Depois de subir os arquivos, **preencha os caminhos em `src/lib/brand-assets.ts` (`heroMedia`)** —
eles vêm como `null` justamente para que a hero não requisite mídia inexistente e o console fique
limpo.

Enquanto os caminhos forem `null`, a hero funciona normalmente: o site exibe o fundo em gradiente
e todo o conteúdo editorial. Nada quebra.

## Direção sugerida

- close de frasco de perfume;
- vidro, âmbar, fumaça delicada, tecido, reflexos dourados ou líquido em movimento;
- movimento lento, aparência cinematográfica;
- **sem texto embutido no vídeo** — a tipografia é aplicada pelo site;
- sem áudio (o vídeo é reproduzido mudo).

## Antes de publicar

- Confirme que o material tem **licença comercial** ou foi produzido pela loja.
  Não use vídeo de terceiros sem autorização e não aponte o site para arquivos hospedados
  em outro domínio.
- Comprima antes de subir. Exemplo com ffmpeg:

  ```bash
  ffmpeg -i original.mov -vf "scale=1920:-2" -c:v libx264 -crf 26 -preset slow \
         -movflags +faststart -an hero-desktop.mp4

  ffmpeg -i original.mov -vf "scale=1080:-2" -c:v libx264 -crf 28 -preset slow \
         -movflags +faststart -an hero-mobile.mp4

  ffmpeg -i hero-desktop.mp4 -vf "select=eq(n\,0)" -q:v 80 ../images/hero-poster.webp
  ```

O caminho dos arquivos é configurável em `src/lib/brand-assets.ts` (`heroMedia`).
