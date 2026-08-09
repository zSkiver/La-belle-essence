import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { formatUnitAddress, siteConfig } from "@/lib/site-config";

const NAV_ITEMS = [
  { href: "#catalogo", label: "Perfumes" },
  { href: "#assinatura", label: "Descubra sua fragrância" },
  { href: "#manifesto", label: "A La Belle" },
  { href: "#unidades", label: "Unidades" },
];

const WEEKDAY_LABELS: Record<string, string> = {
  Monday: "segunda",
  Tuesday: "terça",
  Wednesday: "quarta",
  Thursday: "quinta",
  Friday: "sexta",
  Saturday: "sábado",
  Sunday: "domingo",
};

function formatDays(days: string[]): string {
  const labels = days.map((day) => WEEKDAY_LABELS[day] ?? day);
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels[0]} a ${labels[labels.length - 1]}`;
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const hours = siteConfig.openingHours;

  return (
    <footer className="band-into-ink">
      <div className="shell py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <Wordmark tone="onDark" height={26} />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink-inverse/70">
              {siteConfig.shortDescription}
            </p>
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="gold-underline mt-6 inline-flex min-h-11 items-center text-sm text-ink-inverse transition-colors hover:text-gold"
            >
              Instagram {siteConfig.social.instagramHandle}
            </a>
          </div>

          <nav aria-label="Navegação do rodapé">
            <h2 className="eyebrow-light">Navegar</h2>
            <ul className="mt-5 flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="flex min-h-11 items-center text-sm text-ink-inverse/70 transition-colors hover:text-ink-inverse"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow-light">Unidades</h2>
            <ul className="mt-5 flex flex-col gap-6">
              {siteConfig.units.map((unit) => (
                <li key={unit.id}>
                  <p className="text-sm text-ink-inverse">{unit.name}</p>
                  <address className="mt-1 text-sm leading-relaxed text-ink-inverse/70 not-italic">
                    {formatUnitAddress(unit)}
                  </address>
                  <p className="mt-1 text-sm text-ink-inverse/70 tabular-nums">
                    WhatsApp {unit.whatsappDisplay}
                  </p>
                </li>
              ))}
            </ul>

            {hours ? (
              <div className="mt-8">
                <h2 className="eyebrow-light">Horário</h2>
                <ul className="mt-3 flex flex-col gap-1">
                  {hours.map((entry) => (
                    <li key={entry.days.join("-")} className="text-sm text-ink-inverse/70">
                      {formatDays(entry.days)}, das {entry.opens} às {entry.closes}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ink-inverse/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-inverse/55">
            © {year} {siteConfig.legalName}. Todos os direitos reservados.
          </p>
          <Link
            href="/politica-de-privacidade"
            className="text-xs text-ink-inverse/70 underline-offset-4 transition-colors hover:text-ink-inverse hover:underline"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
