import { useId, type ReactNode } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Campos de formulário do painel administrativo (superfície clara).
 * O rótulo, a dica e a mensagem de erro são ligados ao controle por id, para
 * que leitores de tela anunciem tudo junto.
 */

const controlBase =
  "w-full min-h-11 border border-line bg-white px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink/40 transition-colors focus:border-bronze " +
  "disabled:cursor-not-allowed disabled:bg-ink/5";

const controlInvalid = "border-danger focus:border-danger";

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-[0.14em] text-ink/70">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? (
        <p id={hintId} className="text-xs text-ink/55">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: ComponentPropsWithoutRef<"input"> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, invalid && controlInvalid, className)}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "min-h-28 resize-y leading-relaxed", invalid && controlInvalid, className)}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"select"> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={cn(controlBase, "appearance-none pr-8", invalid && controlInvalid, className)}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: ComponentPropsWithoutRef<"input"> & { label: string; description?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        {...props}
        id={id}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 accent-bronze"
      />
      <label htmlFor={id} className="text-sm text-ink">
        <span className="font-medium">{label}</span>
        {description ? <span className="block text-xs text-ink/60">{description}</span> : null}
      </label>
    </div>
  );
}
