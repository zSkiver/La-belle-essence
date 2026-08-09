import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "./section-heading";

/**
 * Apenas afirmações verificáveis: o que a loja faz e onde ela está.
 * Nada de prêmios, tradição ou selos de autenticidade não comprovados.
 */
const ITEMS = [
  {
    title: "Atendimento presencial",
    description:
      "Você sente a fragrância na pele, com tempo, antes de decidir. Sem pressa e sem roteiro pronto.",
  },
  {
    title: "Curadoria da loja",
    description:
      "O acervo é selecionado e revisado pela equipe — o que está no catálogo é o que a loja escolheu trazer.",
  },
  {
    title: "Duas unidades em Rio Verde",
    description: "Centro e Buriti Shopping, para você escolher onde é mais prático ser atendido.",
  },
  {
    title: "Reserva pelo WhatsApp",
    description:
      "Escolha o perfume aqui e continue a conversa com a consultora, com a mensagem já preenchida.",
  },
];

export function Differentials() {
  return (
    <section aria-labelledby="diferenciais-title" className="shell py-20 sm:py-24">
      <SectionHeading id="diferenciais-title" eyebrow="Como atendemos" title="O que você encontra aqui" />

      <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {ITEMS.map((item, index) => (
          <Reveal as="li" key={item.title} delayMs={(index % 2) * 90} className="flex gap-5">
            <span
              aria-hidden="true"
              className="mt-1.5 font-display text-sm text-gold/70 tabular-nums"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="block font-display text-2xl text-ink">{item.title}</span>
              <span className="mt-2 block max-w-md text-sm leading-relaxed text-ink-muted">
                {item.description}
              </span>
            </span>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
