"use client";

import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { WhatsappGlyph } from "@/components/icons";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";

export function FinalCta() {
  const { requestWhatsapp } = useWhatsapp();

  return (
    <section
      aria-labelledby="cta-final-title"
      className="band-blush relative isolate overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="aurora absolute inset-x-0 -bottom-1/2 -z-10 mx-auto size-[80vw] max-w-[52rem] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-rose)_45%,transparent)_0%,transparent_70%)] blur-3xl"
      />

      <div className="shell relative py-24 text-center sm:py-32">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center">
          <span aria-hidden="true" className="hairline max-w-24" />
          <h2
            id="cta-final-title"
            className="text-balance-tight mt-8 font-display text-4xl leading-[1.08] text-ink sm:text-5xl"
          >
            Ainda dá tempo de escolher o perfume que vão lembrar.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base">
            Conte o que você procura — ocasião, intensidade, o que já usou — e a consultora ajuda a
            estreitar as opções.
          </p>
          <Button
            variant="whatsapp"
            size="lg"
            className="mt-10"
            onClick={() => requestWhatsapp({ source: "final_cta" })}
          >
            <WhatsappGlyph />
            Falar com uma consultora
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
