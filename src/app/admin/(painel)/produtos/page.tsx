import Link from "next/link";
import { checkAdminAccess, listAdminProducts } from "@/data/admin-products";
import { AdminButton } from "@/components/admin/admin-ui";
import { ProductsTable } from "@/components/admin/products-table";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const access = await checkAdminAccess();
  if (access.status !== "ok") return null;

  const products = await listAdminProducts(access.supabase);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Produtos</h1>
          <p className="mt-2 text-sm text-ink/60">
            {products.length === 0
              ? "Nenhum perfume cadastrado."
              : `${products.length} ${products.length === 1 ? "perfume cadastrado" : "perfumes cadastrados"}.`}
          </p>
        </div>
        <AdminButton as={Link} href="/admin/produtos/novo">
          Novo perfume
        </AdminButton>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
