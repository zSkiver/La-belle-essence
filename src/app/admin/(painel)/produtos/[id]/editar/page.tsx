import Link from "next/link";
import { notFound } from "next/navigation";
import { checkAdminAccess, getAdminProduct } from "@/data/admin-products";
import { ProductForm } from "@/components/admin/product-form";
import { formatDateTime } from "@/domain/format";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const access = await checkAdminAccess();
  if (access.status !== "ok") return null;

  const product = await getAdminProduct(access.supabase, id);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/admin/produtos"
          className="text-sm text-ink/60 underline underline-offset-4 transition-colors hover:text-ink"
        >
          ← Produtos
        </Link>
        <h1 className="mt-3 font-display text-4xl text-ink">{product.name}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {product.brand} · última atualização em {formatDateTime(product.updatedAt)}
        </p>
      </div>

      <ProductForm product={product} />
    </div>
  );
}
