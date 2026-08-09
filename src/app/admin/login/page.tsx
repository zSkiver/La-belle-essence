import { LoginForm } from "@/components/admin/login-form";
import { Wordmark } from "@/components/brand/wordmark";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function AdminLoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Wordmark tone="onLight" height={26} />

        <h1 className="mt-10 font-display text-3xl text-ink">Painel administrativo</h1>
        <p className="mt-2 text-sm text-ink/60">
          Acesso restrito à equipe da loja.
        </p>

        {configured ? (
          <LoginForm />
        ) : (
          <div className="mt-8 border border-line bg-white p-5 text-sm leading-relaxed text-ink/75">
            <p className="font-medium text-ink">Supabase ainda não configurado.</p>
            <p className="mt-2">
              Preencha <code className="bg-ink/5 px-1">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
              <code className="bg-ink/5 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no arquivo{" "}
              <code className="bg-ink/5 px-1">.env.local</code> e reinicie o servidor. As
              instruções completas estão no README.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
