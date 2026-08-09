"use client";

import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { WhatsappGlyph } from "@/components/icons";
import { SectionHeading } from "./section-heading";
import { useWhatsapp } from "@/components/whatsapp/whatsapp-provider";
import { formatUnitAddress, getUnitMapsUrl, siteConfig } from "@/lib/site-config";

export function Units() {
  const { requestWhatsapp } = useWhatsapp();

  return (
    <section id="unidades" aria-labelledby="unidades-title" className="shell scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        id="unidades-title"
        eyebrow="Onde nos encontrar"
        title="Duas unidades em Rio Verde"
        description="Escolha a unidade mais prática para você. O atendimento acontece pelo WhatsApp de cada loja."
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {siteConfig.units.map((unit, index) => (
          <Reveal key={unit.id} delayMs={index * 100}>
            <article className="flex h-full flex-col border border-line p-7 transition-colors hover:border-gold/35 sm:p-9">
              <p className="eyebrow">Unidade</p>
              <h3 className="mt-3 font-display text-3xl leading-tight text-ink">{unit.name}</h3>

              <address className="mt-5 text-sm leading-relaxed text-ink-muted not-italic">
                {formatUnitAddress(unit)}
              </address>

              <p className="mt-4 text-sm text-ink-muted">
                WhatsApp{" "}
                <span className="text-ink tabular-nums">{unit.whatsappDisplay}</span>
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  as="a"
                  href={getUnitMapsUrl(unit)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="sm"
                >
                  Como chegar
                </Button>
                <Button
                  variant="whatsapp"
                  size="sm"
                  onClick={() => requestWhatsapp({ source: "unit_section" })}
                >
                  <WhatsappGlyph width={15} height={15} />
                  Falar com esta unidade
                </Button>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
