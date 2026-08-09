import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/cn";

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex max-w-3xl flex-col",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2
        id={id}
        className="text-balance-tight mt-4 font-display text-4xl leading-[1.08] text-ink sm:text-5xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
