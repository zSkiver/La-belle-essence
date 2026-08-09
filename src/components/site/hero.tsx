"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { WhatsappGlyph } from "@/components/icons";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";
import { heroMedia } from "@/lib/brand-assets";
import { formatUnitAddress, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/cn";

/**
 * Em que trecho da rolagem cada elemento entra.
 * `from` é o ponto de início (0 a 1) e `span`, quanto dura a entrada.
 */
function stage(from: number, span: number): CSSProperties {
  return { "--stage-from": from, "--stage-span": span } as CSSProperties;
}

/**
 * Hero cinematográfica comandada pela rolagem.
 *
 * A seção é um trilho alto com um painel preso no topo (`sticky`). Enquanto a
 * página rola sobre esse trilho, um único número — `--hero-progress`, de 0 a 1 —
 * comanda duas coisas:
 *
 *   • o **vídeo avança**: a rolagem é a linha do tempo dele, quadro a quadro
 *     (por isso os arquivos são codificados com keyframe a cada 6 quadros — o
 *     seek precisa ser barato, senão a rolagem engasga);
 *   • o **texto entra em etapas**: antessala e wordmark se resolvem primeiro,
 *     depois a chamada, os botões e os endereços.
 *
 * O wordmark nunca chega a ficar invisível: quem abre a página e não rola
 * continua vendo a marca e o `h1`, então o LCP não depende de interação.
 *
 * Sem movimento permitido, nada disso roda — fica o poster e todo o texto
 * visível de uma vez.
 */
export function Hero() {
  const { requestWhatsapp } = useWhatsapp();
  const trackRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Movimento permitido pelo sistema. Comanda tanto o vídeo quanto o efeito de
   * rolagem, e reage a mudanças em tempo real — inclusive à emulação de
   * `prefers-reduced-motion` do DevTools, sem precisar recarregar.
   */
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [posterReady, setPosterReady] = useState(false);

  const hasVideo = heroMedia.videoDesktop !== null || heroMedia.videoMobile !== null;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    if (!motionAllowed) {
      track.style.removeProperty("--hero-progress");
      return;
    }

    let frame = 0;

    const write = () => {
      frame = 0;

      const rect = track.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress = distance <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / distance));

      track.style.setProperty("--hero-progress", progress.toFixed(4));

      // A rolagem é a linha do tempo do vídeo.
      const video = videoRef.current;
      if (video && video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
        const target = progress * video.duration;
        // Só busca quando o salto vale um quadro: evita afogar o decodificador.
        if (Math.abs(video.currentTime - target) > 1 / 48) {
          video.currentTime = target;
        }
      }
    };

    // Uma única leitura de layout por quadro, mesmo em rolagem contínua.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [motionAllowed]);

  /**
   * O vídeo é controlado à mão. O `autoPlay` existe só para destravar o
   * decodificador no iOS, que ignora `preload`; pausamos no primeiro quadro e
   * a partir daí quem manda no tempo é a rolagem.
   */
  const takeManualControl = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setVideoReady(true);
  };

  return (
    <section
      id="topo"
      ref={trackRef}
      aria-labelledby="hero-title"
      className="hero-track relative h-[240svh] bg-ink"
    >
      {/* Painel preso: é ele que ocupa a tela enquanto o trilho rola. */}
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden">
        {/* 1. Campo escuro permanente */}
        <div aria-hidden="true" className="absolute inset-0 bg-ink" />

        {/* 2. Poster — recorte em pé no celular, deitado no desktop */}
        {heroMedia.poster ? (
          <picture>
            {heroMedia.posterMobile ? (
              <source media="(max-width: 767px)" srcSet={heroMedia.posterMobile} />
            ) : null}
            {/* Fundo full-bleed servido já otimizado, com recorte por tela. */}
            <img
              src={heroMedia.poster}
              alt=""
              aria-hidden="true"
              onLoad={() => setPosterReady(true)}
              className={cn(
                "hero-media absolute inset-0 size-full object-cover transition-opacity duration-1000",
                posterReady && !videoReady ? "opacity-100" : "opacity-0",
              )}
            />
          </picture>
        ) : null}

        {/* 3. Vídeo — sem loop e sem reprodução automática: quem avança é a rolagem */}
        {motionAllowed && hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            onLoadedData={takeManualControl}
            className={cn(
              "hero-media absolute inset-0 size-full bg-transparent object-cover transition-opacity duration-700",
              videoReady ? "opacity-100" : "opacity-0",
            )}
          >
            {heroMedia.videoMobile ? (
              <source src={heroMedia.videoMobile} media="(max-width: 767px)" type="video/mp4" />
            ) : null}
            {heroMedia.videoDesktop ? (
              <source src={heroMedia.videoDesktop} type="video/mp4" />
            ) : null}
          </video>
        ) : null}

        {/* Véu de legibilidade */}
        <div aria-hidden="true" className="hero-veil absolute inset-0 bg-ink" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(125%_78%_at_50%_50%,transparent_18%,var(--color-ink)_92%)]"
        />
        {/* Passagem para a página clara logo abaixo */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-surface"
        />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="shell flex flex-1 flex-col justify-center pt-24 pb-28 text-center">
            <p className="hero-stage-soft eyebrow-light" style={stage(0, 0.18)}>
              Alta perfumaria em Rio Verde
            </p>

            <h1 id="hero-title" className="mt-6 sm:mt-8">
              <span
                className="hero-stage-soft hero-wordmark block font-display text-[clamp(3.25rem,15vw,11rem)] leading-[0.86] font-light text-ink-inverse"
                style={stage(0.02, 0.26)}
              >
                La Belle
              </span>
              <span
                className="hero-stage-soft hero-wordmark mt-1 block font-display text-[clamp(3.25rem,15vw,11rem)] leading-[0.86] font-light text-ink-inverse italic"
                style={stage(0.1, 0.26)}
              >
                Essence
              </span>
              <span
                className="hero-stage mt-6 block text-[0.625rem] tracking-[0.42em] text-gold uppercase sm:text-xs"
                style={stage(0.26, 0.16)}
              >
                Perfumaria árabe · Rio Verde · GO
              </span>
            </h1>
          </div>

          {/* Rodapé da hero: assinatura à esquerda, chamada ao centro */}
          <div className="shell relative z-10 pb-8 sm:pb-10">
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-end lg:justify-between">
              <address
                className="hero-stage hidden max-w-[14rem] text-[0.625rem] leading-relaxed text-ink-inverse/45 not-italic lg:block"
                style={stage(0.62, 0.2)}
              >
                {siteConfig.units.map((unit) => (
                  <span key={unit.id} className="block">
                    {unit.name} — {formatUnitAddress(unit)}
                  </span>
                ))}
              </address>

              <div className="flex max-w-xl flex-col items-center gap-6">
                <p
                  className="hero-stage text-center text-sm leading-relaxed text-ink-inverse/80"
                  style={stage(0.36, 0.2)}
                >
                  Fragrâncias que transformam presença em memória. Perfumes árabes marcantes, para
                  quem quer deixar uma assinatura inesquecível.
                </p>

                <div
                  className="hero-stage flex flex-col gap-3 sm:flex-row"
                  style={stage(0.52, 0.2)}
                >
                  <Button as="a" href="#catalogo" size="lg">
                    Descobrir fragrâncias
                  </Button>
                  <Button
                    variant="onDark"
                    size="lg"
                    onClick={() => requestWhatsapp({ source: "hero" })}
                  >
                    <WhatsappGlyph width={16} height={16} />
                    Falar com uma consultora
                  </Button>
                </div>
              </div>

              {/* Trilho de progresso da hero, no lugar dos pontos da referência */}
              <div
                aria-hidden="true"
                className="hidden w-[14rem] items-center justify-end gap-3 lg:flex"
              >
                <span className="text-[0.5625rem] tracking-[0.28em] text-ink-inverse/45 uppercase">
                  Role
                </span>
                <span className="relative block h-16 w-px bg-ink-inverse/20">
                  <span className="hero-rail-fill absolute inset-0 block bg-gold" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
