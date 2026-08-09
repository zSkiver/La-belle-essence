import Link from "next/link";
import { checkAdminAccess, getDashboardStats } from "@/data/admin-products";
import { AdminButton, AdminCard, EmptyBlock, StatCard } from "@/components/admin/admin-ui";
import { formatDateTime } from "@/domain/format";
import { getUnit } from "@/lib/site-config";
import type { StoreUnitId } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  hero: "Hero",
  header: "Cabeçalho",
  product_card: "Card do produto",
  product_modal: "Detalhes do produto",
  floating_button: "Botão flutuante",
  final_cta: "Chamada final",
  unit_section: "Seção de unidades",
  catalog_empty: "Catálogo sem resultados",
  promotions: "Vitrine de promoções",
  campaign: "Faixa de campanha",
};

function unitLabel(value: string): string {
  try {
    return getUnit(value as StoreUnitId).name;
  } catch {
    return value;
  }
}

export default async function AdminDashboardPage() {
  const access = await checkAdminAccess();
  if (access.status !== "ok") return null;

  const stats = await getDashboardStats(access.supabase);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Painel</h1>
          <p className="mt-2 text-sm text-ink/60">
            Visão geral do catálogo e do interesse recebido pelo WhatsApp.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton as={Link} href="/admin/destaques" variant="outline">
            Destaques e ofertas
          </AdminButton>
          <AdminButton as={Link} href="/admin/produtos/novo">
            Novo perfume
          </AdminButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Produtos" value={String(stats.total)} hint="Não excluídos" />
        <StatCard label="Ativos" value={String(stats.active)} hint="Visíveis no site" />
        <StatCard
          label="Sem volume"
          value={String(stats.unavailable)}
          hint="Precisam de variante cadastrada"
        />
        <StatCard label="Em destaque" value={String(stats.featured)} hint="Na vitrine da home" />
        <StatCard label="Oferta ativa" value={String(stats.onPromotion)} hint="No ar agora" />
        <StatCard
          label="Oferta agendada"
          value={String(stats.scheduledOffers)}
          hint="Começa em data futura"
        />
      </div>

      <AdminCard title="Cliques no WhatsApp">
        <p className="text-sm text-ink/70">
          <strong className="font-display text-2xl text-ink tabular-nums">
            {stats.clicksLast30Days}
          </strong>{" "}
          cliques nos últimos 30 dias.
        </p>

        {stats.recentClicks.length === 0 ? (
          <div className="mt-5">
            <EmptyBlock
              title="Nenhum clique registrado ainda"
              description="Assim que alguém iniciar uma conversa a partir do site, o registro aparece aqui."
            />
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <caption className="sr-only">Últimos cliques registrados</caption>
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="py-2 pr-4 font-medium text-ink/60">
                    Quando
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium text-ink/60">
                    Produto
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium text-ink/60">
                    Unidade
                  </th>
                  <th scope="col" className="py-2 font-medium text-ink/60">
                    Origem
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentClicks.map((click) => (
                  <tr key={click.id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-4 whitespace-nowrap text-ink/70 tabular-nums">
                      {formatDateTime(click.createdAt)}
                    </td>
                    <td className="py-3 pr-4 text-ink">
                      {click.productName ?? "Atendimento geral"}
                    </td>
                    <td className="py-3 pr-4 text-ink/70">{unitLabel(click.storeUnit)}</td>
                    <td className="py-3 text-ink/70">
                      {SOURCE_LABELS[click.source] ?? click.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
