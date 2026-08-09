import { Reveal } from "@/components/ui/reveal";

/**
 * Seção de manifesto.
 *
 * Fala sobre perfumaria — presença, memória e o modo de compor das fragrâncias
 * orientais. Não narra a história da empresa, porque ela não foi verificada.
 */
export function Manifesto() {
  return (
    <section id="manifesto" aria-labelledby="manifesto-title" className="shell scroll-mt-24 py-24 sm:py-32">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20">
        <Reveal>
          <p className="eyebrow">A La Belle</p>
          <h2
            id="manifesto-title"
            className="text-balance-tight mt-5 font-display text-4xl leading-[1.06] text-ink sm:text-5xl lg:text-[3.5rem]"
          >
            A presença chega antes da palavra.
          </h2>
        </Reveal>

        <Reveal delayMs={120} className="flex flex-col gap-6 lg:pt-6">
          <p className="text-base leading-relaxed text-ink-muted">
            A perfumaria oriental trabalha com matérias-primas densas — resinas, madeiras, âmbar,
            especiarias — e concentrações mais altas. É por isso que um perfume árabe se anuncia
            devagar, muda ao longo das horas e permanece no tecido muito depois de a pessoa ter
            saído da sala.
          </p>
          <p className="text-base leading-relaxed text-ink-muted">
            Escolher entre eles é menos uma questão de nome e mais de temperamento: o quanto você
            quer ser percebido, em que hora do dia, ao lado de quem. Nossa parte é reduzir esse
            campo com você, com calma e sem pressa de fechar.
          </p>

          <div aria-hidden="true" className="hairline mt-2 max-w-40" />

          <p className="font-display text-xl leading-snug text-rose-deep sm:text-2xl">
            Um perfume bem escolhido não chama atenção. Ele fica na lembrança.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
