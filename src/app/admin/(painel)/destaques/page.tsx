import { checkAdminAccess, listAdminProducts } from "@/data/admin-products";
import { OffersBoard } from "@/components/admin/offers-board";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const access = await checkAdminAccess();
  if (access.status !== "ok") return null;

  const products = await listAdminProducts(access.supabase);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl text-ink">Destaques e ofertas</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Escolha o que aparece na vitrine da página inicial e por quanto tempo cada promoção fica
          no ar.
        </p>
      </div>

      <OffersBoard products={products} />
    </div>
  );
}
