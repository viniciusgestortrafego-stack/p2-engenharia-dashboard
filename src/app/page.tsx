"use client";

import { Suspense, useEffect, useState } from "react";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { TimelineChart } from "@/components/charts/TimelineChart";
import { DataStatus } from "@/components/ui/DataStatus";
import { CampaignTable } from "@/components/ui/CampaignTable";
import { useConfigStatus } from "@/lib/useConfigStatus";
import { useDateRange } from "@/lib/dateRange";
import { formatBRL, formatNumber, formatShortDate } from "@/lib/format";
import { BreakdownItem, CampaignPerformanceRow, MetaFetchError, fetchCampaignPerformance, fetchDailySalesRows, fetchPurchaseBreakdown, formatAgeGenderLabel, formatDeviceLabel } from "@/lib/meta";
import { SalesRow, aggregateSalesRows, filterRowsByRange } from "@/lib/sales";
import { siteConfig } from "@/config/site";

function OverviewContent() {
  const { status: configStatus, loaded } = useConfigStatus();
  const { from, to } = useDateRange();

  const [rows, setRows] = useState<SalesRow[]>([]);
  const [placementData, setPlacementData] = useState<BreakdownItem[]>([]);
  const [deviceData, setDeviceData] = useState<BreakdownItem[]>([]);
  const [ageGenderData, setAgeGenderData] = useState<BreakdownItem[]>([]);
  const [campaignRows, setCampaignRows] = useState<CampaignPerformanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loaded || !configStatus.hasMeta) return;
    const { adAccountId } = configStatus;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchDailySalesRows({ adAccountId, since: from, until: to }),
      fetchPurchaseBreakdown({ adAccountId, breakdowns: ["publisher_platform", "platform_position"], since: from, until: to }),
      fetchPurchaseBreakdown({ adAccountId, breakdowns: ["device_platform"], since: from, until: to, formatLabel: formatDeviceLabel }),
      fetchPurchaseBreakdown({ adAccountId, breakdowns: ["age", "gender"], since: from, until: to, formatLabel: formatAgeGenderLabel }),
      fetchCampaignPerformance({ adAccountId, since: from, until: to }),
    ])
      .then(([salesRows, placement, device, ageGender, campaigns]) => {
        setRows(salesRows);
        setPlacementData(placement);
        setDeviceData(device);
        setAgeGenderData(ageGender);
        setCampaignRows(campaigns);
      })
      .catch((err) => setError(err instanceof MetaFetchError ? err.message : "Erro ao buscar dados do Meta Ads"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, configStatus.hasMeta, configStatus.adAccountId, from, to]);

  const status = DataStatus({
    configured: configStatus.hasMeta,
    loading,
    error,
    configureMessage: `Configure o token e a conta do Meta Ads em Configurações para ver os números de ${siteConfig.clientName}.`,
  });

  const periodRows = filterRowsByRange(rows, from, to);
  const totals = aggregateSalesRows(periodRows);
  const timelineData = periodRows
    .filter((row) => row.dateObj)
    .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime())
    .map((row) => ({ date: formatShortDate(row.dateObj!), receita: row.receita }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">{siteConfig.clientName}</h1>
        <p className="text-gray-400">Meta Ads</p>
      </div>

      {status ?? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vendas</h3>
              <p className="text-3xl font-bold">{formatNumber(totals.compras)}</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Receita</h3>
              <p className="text-3xl font-bold">{formatBRL(totals.receita)}</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Investido</h3>
              <p className="text-3xl font-bold">{formatBRL(totals.investimento)}</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Custo por Venda</h3>
              <p className="text-3xl font-bold">{formatBRL(totals.custoPorCompra)}</p>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ROAS</h3>
              <p className="text-3xl font-bold">{totals.roas.toFixed(2)}x</p>
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-2">Evolução Temporal</h2>
            <p className="text-sm text-gray-500 mb-4">Receita por dia</p>
            {timelineData.length > 0 ? (
              <TimelineChart data={timelineData} dataKey="receita" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">Sem dados no período selecionado</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Compras por Posicionamento</h2>
              {placementData.length > 0 ? (
                <HorizontalBarChart data={placementData} />
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">Sem compras registradas no período</div>
              )}
            </div>

            <div className="lg:col-span-3 bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Compras por Dispositivo</h2>
              {deviceData.length > 0 ? (
                <div className="space-y-4">
                  {deviceData.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-card-border pb-2 last:border-0">
                      <span className="font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </span>
                      <span className="font-bold text-primary">{formatNumber(item.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">Sem compras registradas no período</div>
              )}
            </div>

            <div className="lg:col-span-3 bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Compras por Idade e Gênero</h2>
              {ageGenderData.length > 0 ? (
                <div className="space-y-4">
                  {ageGenderData.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-card-border pb-2 last:border-0">
                      <span className="font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                      </span>
                      <span className="font-bold text-primary">{formatNumber(item.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">Sem compras registradas no período</div>
              )}
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Visão Geral de Campanhas</h2>
            <CampaignTable rows={campaignRows} />
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <OverviewContent />
    </Suspense>
  );
}
