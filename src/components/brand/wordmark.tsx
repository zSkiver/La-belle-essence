import Image from "next/image";
import { brandLogo } from "@/lib/brand-assets";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/cn";

export type WordmarkTone = "onDark" | "onLight";

/**
 * Assinatura da marca.
 *
 * Se o logotipo oficial estiver configurado em `brandLogo`, ele é exibido com a
 * proporção original preservada. Caso contrário, cai para um wordmark
 * tipográfico provisório — nenhum símbolo é inventado.
 */
export function Wordmark({
  tone = "onDark",
  className,
  height = 28,
}: {
  tone?: WordmarkTone;
  className?: string;
  height?: number;
}) {
  const source = brandLogo[tone];

  if (source) {
    return (
      <Image
        src={source}
        alt={siteConfig.name}
        height={height}
        width={Math.round(height * brandLogo.aspectRatio)}
        priority
        className={cn("h-auto w-auto", className)}
      />
    );
  }

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-display text-xl leading-none font-normal sm:text-[1.375rem]",
          tone === "onDark" ? "text-gold" : "text-gold-deep",
        )}
      >
        La Belle
      </span>
      <span
        className={cn(
          "mt-1.5 font-sans text-[0.5rem] font-medium uppercase tracking-[0.46em]",
          tone === "onDark" ? "text-ink-inverse/80" : "text-ink-muted",
        )}
      >
        Essence
      </span>
    </span>
  );
}
