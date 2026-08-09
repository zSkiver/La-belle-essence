"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { credentialsSchema, passwordRecoverySchema } from "@/domain/schemas";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Field, TextInput } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Mode = "login" | "recovery";

const adminButton =
  "inline-flex min-h-11 w-full cursor-pointer items-center justify-center bg-ink px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-rose-deep disabled:cursor-not-allowed disabled:opacity-50";

export function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.reduce<{ email?: string; password?: string }>(
        (acc, issue) => {
          const key = issue.path[0];
          if (key === "email" || key === "password") acc[key] = issue.message;
          return acc;
        },
        {},
      );
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setFormError("Supabase não configurado.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);

    if (error) {
      // Mensagem genérica de propósito: não revela se o e-mail existe.
      setFormError("E-mail ou senha incorretos.");
      return;
    }

    const redirectTo = new URLSearchParams(window.location.search).get("redirect");
    router.replace(redirectTo && redirectTo.startsWith("/admin") ? redirectTo : "/admin");
    router.refresh();
  };

  const handleRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = passwordRecoverySchema.safeParse({ email });
    if (!parsed.success) {
      setErrors({ email: parsed.error.issues[0]?.message });
      return;
    }

    setErrors({});
    setSubmitting(true);

    const supabase = getBrowserSupabase();
    if (!supabase) {
      setFormError("Supabase não configurado.");
      setSubmitting(false);
      return;
    }

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/admin/login`,
    });

    setSubmitting(false);
    // Resposta idêntica exista ou não a conta, para não vazar cadastros.
    toast.info("Se houver uma conta com este e-mail, enviaremos as instruções.");
    setMode("login");
  };

  return (
    <form
      onSubmit={mode === "login" ? handleLogin : handleRecovery}
      noValidate
      className="mt-8 flex flex-col gap-5"
    >
      <Field label="E-mail" error={errors.email} required>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>

      {mode === "login" ? (
        <Field label="Senha" error={errors.password} required>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
      ) : null}

      {formError ? (
        <p role="alert" className="border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className={cn(adminButton, "mt-1")}>
        {submitting ? "Aguarde…" : mode === "login" ? "Entrar" : "Enviar instruções"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "recovery" : "login");
          setFormError(null);
          setErrors({});
        }}
        className="min-h-11 text-sm text-ink/60 underline underline-offset-4 transition-colors hover:text-ink"
      >
        {mode === "login" ? "Esqueci minha senha" : "Voltar para o login"}
      </button>
    </form>
  );
}
