import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "gold" | "rose" | "ink" | "muted" | "promo";

const tones: Record<BadgeTone, string> = {
  gold: "border-gold text-gold-deep bg-gold-tint/60",
  rose: "border-rose text-rose-deep bg-rose-tint/70",
  ink: "border-ink bg-ink text-ink-inverse",
  muted: "border-line text-ink-faint bg-surface-raised/80",
  /** Desconto: o único tom cheio, para não competir com os demais selos. */
  promo: "border-rose-deep bg-rose-deep text-ink-inverse",
};

export function Badge({
  children,
  tone = "gold",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.18em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
