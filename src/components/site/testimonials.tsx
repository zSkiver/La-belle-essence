import { Reveal } from "@/components/ui/reveal";
import { siteConfig } from "@/lib/site-config";
import { SectionHeading } from "./section-heading";

/**
 * Depoimentos.
 *
 * A estrutura está pronta, mas nada é exibido enquanto não houver avaliações
 * reais e autorizadas. Para publicar, preencha `siteConfig.testimonials` em
 * `src/lib/site-config.ts` com depoimentos efetivamente recebidos — nomes e
 * textos não devem ser inventados.
 */
export function Testimonials() {
  const testimonials = siteConfig.testimonials;

  if (testimonials.length === 0) return null;

  return (
    <section aria-labelledby="depoimentos-title" className="shell py-20 sm:py-24">
      <SectionHeading id="depoimentos-title" eyebrow="Quem já foi atendido" title="Depoimentos" />

      <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Reveal as="li" key={`${testimonial.author}-${index}`} delayMs={(index % 3) * 90}>
            <figure className="flex h-full flex-col border border-line bg-surface-raised p-6">
              <blockquote className="flex-1 font-display text-xl leading-snug text-ink">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-6 text-xs uppercase tracking-[0.18em] text-ink-muted">
                {testimonial.author}
                {testimonial.unit ? ` · ${testimonial.unit}` : null}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
