"use client";

import { Suspense, useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Target, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataStatus } from "@/components/ui/DataStatus";
import { PerformanceTable } from "@/components/ui/PerformanceTable";
import { useConfigStatus } from "@/lib/useConfigStatus";
import { useDateRange } from "@/lib/dateRange";
import { formatBRL, formatNumber } from "@/lib/format";
import { EntityPerformanceRow, MetaFetchError, fetchEntityPerformance } from "@/lib/meta";

function CriativosContent() {
  const { status: configStatus, loaded } = useConfigStatus();
  const { from, to } = useDateRange();

  const [rows, setRows] = useState<EntityPerformanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loaded || !configStatus.hasMeta) return;
    setLoading(true);
    setError(null);
    fetchEntityPerformance({ adAccountId: configStatus.adAccountId, level: "ad", since: from, until: to })
      .then(setRows)
      .catch((err) => setError(err instanceof MetaFetchError ? err.message : "Erro ao buscar dados do Meta Ads"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, configStatus.hasMeta, configStatus.adAccountId, from, to]);

  const status = DataStatus({
    configured: configStatus.hasMeta,
    loading,
    error,
    configureMessage: "Configure o token e a conta do Meta Ads em Configurações para ver a performance dos criativos.",
  });

  const totalSpend = rows.reduce((acc, row) => acc + row.spend, 0);
  const totalPurchases = rows.reduce((acc, row) => acc + row.purchases, 0);
  const totalRevenue = rows.reduce((acc, row) => acc + row.revenue, 0);
  const avgCpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Criativos</h1>
        <p className="text-gray-400">Performance por anúncio no período</p>
      </div>

      {status ?? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <MetricCard title="Investimento Total" value={formatBRL(totalSpend)} subtitle="somado no período" icon={<DollarSign size={18} />} />
            <MetricCard title="Compras" value={formatNumber(totalPurchases)} subtitle="total de vendas atribuídas" icon={<ShoppingCart size={18} />} />
            <MetricCard title="Receita" value={formatBRL(totalRevenue)} subtitle="retorno de vendas" icon={<DollarSign size={18} />} />
            <MetricCard title="ROAS Médio" value={`${avgRoas.toFixed(2)}x`} subtitle="receita / investimento" icon={<TrendingUp size={18} />} />
            <MetricCard title="CPA Médio" value={formatBRL(avgCpa)} subtitle="investimento / compras" icon={<Target size={18} />} />
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Performance por Criativo</h2>
            <PerformanceTable rows={rows} nameColumnLabel="Criativo" showThumbnails />
          </div>
        </>
      )}
    </div>
  );
}

export default function CriativosPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <CriativosContent />
    </Suspense>
  );
}
