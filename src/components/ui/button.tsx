import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "outline" | "ghost" | "whatsapp" | "quiet" | "onDark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-sans text-sm font-medium tracking-wide " +
  "transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-silk)] " +
  "disabled:cursor-not-allowed disabled:opacity-45 " +
  // Área de toque mínima de 44px em todos os tamanhos.
  "min-h-11 cursor-pointer active:translate-y-px";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-ink-inverse hover:bg-rose-deep",
  outline: "border border-line-strong text-ink hover:border-gold hover:bg-gold-tint/50",
  ghost: "text-ink-muted hover:text-ink",
  whatsapp: "bg-forest text-ink-inverse hover:bg-forest/88",
  quiet: "bg-surface-raised text-ink border border-line hover:border-gold-deep",
  /** Para uso sobre os blocos escuros de campanha. */
  onDark: "border border-ink-inverse/35 text-ink-inverse hover:border-gold hover:bg-ink-inverse/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3",
  lg: "px-8 py-4 text-[0.9375rem]",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children">;

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps<T>) {
  const Component = (as ?? "button") as ElementType;
  return (
    <Component className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Component>
  );
}
