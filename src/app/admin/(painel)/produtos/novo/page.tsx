import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin/produtos"
          className="text-sm text-ink/60 underline underline-offset-4 transition-colors hover:text-ink"
        >
          ← Produtos
        </Link>
        <h1 className="mt-3 font-display text-4xl text-ink">Novo perfume</h1>
        <p className="mt-2 text-sm text-ink/60">
          Cadastre ao menos um volume com preço para que o perfume possa ser solicitado pelo
          WhatsApp.
        </p>
      </div>

      <ProductForm product={null} />
    </div>
  );
}
