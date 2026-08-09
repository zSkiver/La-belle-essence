import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Wordmark height={24} />
      <p className="eyebrow mt-12">Erro 404</p>
      <h1 className="text-balance-tight mt-4 max-w-lg font-display text-4xl leading-tight text-ink sm:text-5xl">
        Esta página não existe.
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
        O endereço pode ter mudado ou o link estar incompleto. Volte ao catálogo para continuar
        procurando sua fragrância.
      </p>
      <Link href="/" className={buttonClasses("primary", "lg", "mt-10")}>
        Voltar ao início
      </Link>
    </main>
  );
}
