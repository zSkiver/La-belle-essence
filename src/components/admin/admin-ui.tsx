import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type AdminButtonVariant = "solid" | "outline" | "ghost" | "danger";

const variants: Record<AdminButtonVariant, string> = {
  solid: "bg-ink text-ink hover:bg-rose-deep",
  outline: "border border-line text-ink hover:border-line hover:bg-ink/5",
  ghost: "text-ink/70 hover:text-ink hover:bg-ink/5",
  danger: "border border-danger/40 text-danger hover:bg-danger/8",
};

export function adminButtonClasses(
  variant: AdminButtonVariant = "solid",
  className?: string,
): string {
  return cn(
    "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm font-medium",
    "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );
}

type AdminButtonProps<T extends ElementType> = {
  as?: T;
  variant?: AdminButtonVariant;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

export function AdminButton<T extends ElementType = "button">({
  as,
  variant = "solid",
  className,
  children,
  ...rest
}: AdminButtonProps<T>) {
  const Component = (as ?? "button") as ElementType;
  return (
    <Component className={adminButtonClasses(variant, className)} {...rest}>
      {children}
    </Component>
  );
}

export function AdminCard({
  title,
  children,
  actions,
  className,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-line bg-white", className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          {title ? (
            <h2 className="font-display text-xl text-ink">{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-line bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink/55">{label}</p>
      <p className="mt-3 font-display text-4xl leading-none text-ink tabular-nums">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ink/50">{hint}</p> : null}
    </div>
  );
}

export function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed border-line px-6 py-12 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">{description}</p>
    </div>
  );
}
