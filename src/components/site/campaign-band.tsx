"use client";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { WhatsappGlyph } from "@/components/icons";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";

/**
 * Bloco de campanha em tela cheia.
 *
 * Corta o ritmo claro da página com uma faixa escura, do jeito que as casas de
 * perfumaria fazem entre um módulo e outro. Não usa fotografia: a composição é
 * feita com o arco de portal e o campo de luz, então não depende de material
 * que a loja ainda não tem.
 */
export function CampaignBand() {
  const { requestWhatsapp } = useWhatsapp();

  return (
    <section
      aria-labelledby="campanha-title"
      className="band-ink relative isolate overflow-hidden py-28 text-ink-inverse sm:py-36"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="aurora absolute -top-1/4 left-[-10%] size-[60vw] max-w-[44rem] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-rose-deep)_70%,transparent)_0%,transparent_70%)] blur-3xl" />
        <div
          className="aurora absolute right-[-12%] bottom-[-30%] size-[52vw] max-w-[38rem] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-gold)_36%,transparent)_0%,transparent_72%)] blur-3xl"
          style={{ animationDelay: "-9s" }}
        />
        <div className="absolute inset-x-[8%] top-[10%] bottom-0 border-x border-t border-gold/25 [border-start-end-radius:22rem] [border-start-start-radius:22rem] sm:inset-x-[26%]" />
      </div>

      <div className="shell relative text-center">
        <Reveal variant="fade">
          <p className="text-[0.6875rem] font-medium tracking-[var(--tracking-editorial)] text-gold uppercase">
            Perfumaria oriental
          </p>
        </Reveal>

        <Reveal variant="blur" delayMs={120}>
          <h2
            id="campanha-title"
            className="text-balance-tight mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.08] sm:text-6xl"
          >
            Resinas, madeiras e âmbar. O tempo faz o resto.
          </h2>
        </Reveal>

        <Reveal variant="up" delayMs={260}>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink-inverse/75 sm:text-base">
            Concentrações mais altas mudam a forma como um perfume se revela: primeiro a abertura,
            depois o coração, e um fundo que fica no tecido muito depois da conversa.
          </p>
        </Reveal>

        <Reveal variant="up" delayMs={380}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button as="a" href="#catalogo" variant="onDark" size="lg">
              Explorar o acervo
            </Button>
            <Button
              variant="whatsapp"
              size="lg"
              onClick={() => requestWhatsapp({ source: "campaign" })}
            >
              <WhatsappGlyph width={16} height={16} />
              Pedir uma indicação
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
