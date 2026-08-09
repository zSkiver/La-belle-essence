import Link from "next/link";
import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/data/admin-products";
import { Wordmark } from "@/components/brand/wordmark";
import { AdminButton } from "@/components/admin/admin-ui";
import { signOutAction } from "../actions";

const NAV = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/produtos", label: "Perfumes" },
  { href: "/admin/destaques", label: "Destaques e ofertas" },
];

function AccessNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-md border border-line bg-white p-7">
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        <div className="mt-3 text-sm leading-relaxed text-ink/70">{children}</div>
      </div>
    </main>
  );
}

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const access = await checkAdminAccess();

  if (access.status === "unconfigured") {
    return (
      <AccessNotice title="Supabase não configurado">
        <p>
          Preencha as variáveis de ambiente do Supabase em <code>.env.local</code> e reinicie o
          servidor. O README traz o passo a passo, incluindo como criar o primeiro administrador.
        </p>
      </AccessNotice>
    );
  }

  if (access.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (access.status === "forbidden") {
    return (
      <AccessNotice title="Sem permissão">
        <p>
          A conta <strong>{access.email}</strong> está autenticada, mas não consta na lista de
          administradores.
        </p>
        <p className="mt-3">
          Peça a quem administra o projeto no Supabase para inserir o seu usuário na tabela{" "}
          <code>admin_users</code>.
        </p>
        <form action={signOutAction} className="mt-6">
          <AdminButton type="submit" variant="outline">
            Sair
          </AdminButton>
        </form>
      </AccessNotice>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <Link href="/admin" aria-label="Painel administrativo">
              <Wordmark tone="onLight" height={22} />
            </Link>

            <nav aria-label="Navegação do painel">
              <ul className="flex items-center gap-1">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center px-3 text-sm text-ink/70 transition-colors hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-sm text-ink/60 underline underline-offset-4 transition-colors hover:text-ink sm:inline"
            >
              Ver o site
            </Link>
            <span className="hidden text-sm text-ink/50 md:inline">{access.email}</span>
            <form action={signOutAction}>
              <AdminButton type="submit" variant="ghost">
                Sair
              </AdminButton>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:py-12">{children}</main>
    </div>
  );
}
