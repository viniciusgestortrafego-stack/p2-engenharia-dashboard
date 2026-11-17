"use client";

import { Suspense, useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { DollarSign, MousePointerClick, Link as LinkIcon, Activity, Percent, ShoppingCart, TrendingUp } from "lucide-react";
import { StepFunnel } from "@/components/ui/StepFunnel";
import { DonutChart } from "@/components/charts/DonutChart";
import { TimelineChart } from "@/components/charts/TimelineChart";
import { DataStatus } from "@/components/ui/DataStatus";
import { UtmList } from "@/components/ui/UtmList";
import { useConfigStatus } from "@/lib/useConfigStatus";
import { useDateRange } from "@/lib/dateRange";
import { formatBRL, formatNumber, formatPercent, formatShortDate } from "@/lib/format";
import { MetaFetchError, fetchDailySalesRows } from "@/lib/meta";
import { SalesRow, aggregateSalesRows, filterRowsByRange } from "@/lib/sales";
import { UtmBreakdownItem, WooFetchError, fetchUtmBreakdown } from "@/lib/woocommerce";
import {
  GoogleAdsRow,
  GoogleAdsConversionRow,
  aggregateConversionBreakdown,
  aggregateGoogleAdsRows,
  fetchGoogleAdsData,
  filterConversionsByRange,
  filterGoogleAdsRowsByRange,
} from "@/lib/googleAds";
import { siteConfig } from "@/config/site";

function LandingPageContent() {
  const { status: configStatus, loaded } = useConfigStatus();
  const { from, to } = useDateRange();

  const [rows, setRows] = useState<SalesRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [googleRows, setGoogleRows] = useState<GoogleAdsRow[]>([]);
  const [googleConversionBreakdown, setGoogleConversionBreakdown] = useState<GoogleAdsConversionRow[]>([]);
  const [googleConversionActionCategories, setGoogleConversionActionCategories] = useState<Record<string, string>>({});

  const [utmSourceData, setUtmSourceData] = useState<UtmBreakdownItem[]>([]);
  const [utmCampaignData, setUtmCampaignData] = useState<UtmBreakdownItem[]>([]);
  const [utmContentData, setUtmContentData] = useState<UtmBreakdownItem[]>([]);
  const [utmError, setUtmError] = useState<string | null>(null);
  const [utmLoading, setUtmLoading] = useState(false);

  useEffect(() => {
    if (!loaded || !configStatus.hasMeta) return;
    setLoading(true);
    setError(null);
    fetchDailySalesRows({ adAccountId: configStatus.adAccountId, since: from, until: to })
      .then(setRows)
      .catch((err) => setError(err instanceof MetaFetchError ? err.message : "Erro ao buscar dados do Meta Ads"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, configStatus.hasMeta, configStatus.adAccountId, from, to]);

  useEffect(() => {
    // Google Ads is a bonus channel on this page — if it fails or isn't set up yet,
    // the funnel still works with Meta Ads data alone, so failures are swallowed.
    fetchGoogleAdsData()
      .then((data) => {
        setGoogleRows(data.rows);
        setGoogleConversionBreakdown(data.conversionBreakdown);
        setGoogleConversionActionCategories(data.conversionActionCategories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!loaded || !configStatus.hasWoo) return;
    const { wooStoreUrl } = configStatus;
    setUtmLoading(true);
    setUtmError(null);
    Promise.all([
      fetchUtmBreakdown({ wooStoreUrl, since: from, until: to, groupBy: "source" }),
      fetchUtmBreakdown({ wooStoreUrl, since: from, until: to, groupBy: "campaign" }),
      fetchUtmBreakdown({ wooStoreUrl, since: from, until: to, groupBy: "content" }),
    ])
      .then(([source, campaign, content]) => {
        setUtmSourceData(source);
        setUtmCampaignData(campaign);
        setUtmContentData(content);
      })
      .catch((err) => setUtmError(err instanceof WooFetchError ? err.message : "Erro ao buscar pedidos do WooCommerce"))
      .finally(() => setUtmLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, configStatus.hasWoo, configStatus.wooStoreUrl, from, to]);

  const status = DataStatus({
    configured: configStatus.hasMeta,
    loading,
    error,
    configureMessage: "Configure o token e a conta do Meta Ads em Configurações para ver o funil de vendas.",
  });

  const utmStatus = DataStatus({
    configured: configStatus.hasWoo,
    loading: utmLoading,
    error: utmError,
    configureMessage: "Configure a loja WooCommerce em Configurações para ver as vendas por UTM.",
  });

  const periodRows = filterRowsByRange(rows, from, to);
  const metaTotals = aggregateSalesRows(periodRows);
  const timelineData = periodRows
    .filter((row) => row.dateObj)
    .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime())
    .map((row) => ({ date: formatShortDate(row.dateObj!), receita: row.receita }));

  const periodGoogleRows = filterGoogleAdsRowsByRange(googleRows, from, to);
  const googleTotals = aggregateGoogleAdsRows(periodGoogleRows);
  const googlePurchases = aggregateConversionBreakdown(filterConversionsByRange(googleConversionBreakdown, from, to))
    .filter((item) => googleConversionActionCategories[item.name] === "PURCHASE")
    .reduce((acc, item) => ({ conversions: acc.conversions + item.conversions, conversionValue: acc.conversionValue + item.conversionValue }), { conversions: 0, conversionValue: 0 });

  // The funnel combines Meta Ads + Google Ads for the channel-agnostic top-of-funnel
  // and sales metrics; "Visitas à Página" and "Checkouts Iniciados" stay Meta-only
  // since that's pixel/landing-page tracking Google Ads doesn't report the same way.
  const investimento = metaTotals.investimento + googleTotals.spend;
  const impressoes = metaTotals.impressoes + googleTotals.impressions;
  const cliques = metaTotals.cliques + googleTotals.clicks;
  const compras = metaTotals.compras + googlePurchases.conversions;
  const receita = metaTotals.receita + googlePurchases.conversionValue;
  const custoPorCompra = compras > 0 ? investimento / compras : 0;
  const roas = investimento > 0 ? receita / investimento : 0;
  const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
  const cpm = impressoes > 0 ? (investimento / impressoes) * 1000 : 0;
  const cpc = cliques > 0 ? investimento / cliques : 0;

  const totals = { ...metaTotals, investimento, impressoes, cliques, compras, receita, custoPorCompra, roas, ctr, cpm, cpc };

  const funnelBase = impressoes || 1;
  const funnelSteps = [
    { label: "INVESTIMENTO", value: formatBRL(investimento), percentage: 100 },
    { label: "IMPRESSÕES", value: formatNumber(impressoes), subtext: `CPM ${formatBRL(cpm)}`, percentage: 100 },
    { label: "CLIQUES", value: formatNumber(cliques), subtext: `${formatPercent(ctr)} CTR`, percentage: (cliques / funnelBase) * 100 },
    { label: "VISITAS À PÁGINA", value: formatNumber(metaTotals.visitasLP), subtext: `Connect Rate ${formatPercent(metaTotals.connectRate)}`, percentage: (metaTotals.visitasLP / funnelBase) * 100 },
    { label: "CHECKOUTS INICIADOS", value: formatNumber(metaTotals.checkoutsIniciados), subtext: `Tx. Conversão ${formatPercent(metaTotals.taxaConversaoCheckout)}`, percentage: (metaTotals.checkoutsIniciados / funnelBase) * 100 },
    { label: "COMPRAS", value: formatNumber(compras), subtext: `CPL ${formatBRL(custoPorCompra)}`, percentage: (compras / funnelBase) * 100 },
  ];

  const investRevenueData = [
    { name: "Investimento", value: investimento, color: "#2a78d6" },
    { name: "Receita", value: receita, color: "#1baf7a" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{siteConfig.clientName}</h1>
          <p className="text-gray-400">Funil de Vendas</p>
        </div>
      </div>

      {status ?? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Investimento" value={formatBRL(totals.investimento)} subtitle="valor usado no período" icon={<DollarSign size={18} />} />
            <MetricCard title="Compras" value={formatNumber(totals.compras)} subtitle="vendas no período" icon={<ShoppingCart size={18} />} />
            <MetricCard title="Receita" value={formatBRL(totals.receita)} subtitle="faturamento no período" icon={<DollarSign size={18} />} />
            <MetricCard title="ROAS" value={`${totals.roas.toFixed(2)}x`} subtitle="receita / investimento" icon={<TrendingUp size={18} />} />
            <MetricCard title="Custo por Compra" value={formatBRL(totals.custoPorCompra)} subtitle="investimento / compras" icon={<DollarSign size={18} />} />
            <MetricCard title="Impressões" value={formatNumber(totals.impressoes)} subtitle="entregas no período" icon={<Activity size={18} />} />
            <MetricCard title="Cliques" value={formatNumber(totals.cliques)} subtitle="cliques no link" icon={<MousePointerClick size={18} />} />
            <MetricCard title="CPC" value={formatBRL(totals.cpc)} subtitle="custo por clique" icon={<DollarSign size={18} />} />
            <MetricCard title="Visitas na Página" value={formatNumber(totals.visitasLP)} subtitle="acessos à landing page" icon={<LinkIcon size={18} />} />
            <MetricCard title="Connect Rate" value={formatPercent(totals.connectRate)} subtitle="cliques → visualizações" icon={<Percent size={18} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Funil de Vendas</h2>
              <StepFunnel steps={funnelSteps} />
            </div>

            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Investimento vs Receita</h2>
              <DonutChart data={investRevenueData} total={formatBRL(totals.receita)} label="RECEITA" />

              <div className="w-full space-y-3 mt-4">
                {investRevenueData.map((item) => (
                  <div key={item.name} className="flex justify-between items-center text-sm border-b border-card-border pb-2 last:border-0 last:pb-0">
                    <span className="font-bold flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }}></span> {item.name}
                    </span>
                    <span className="font-bold">{formatBRL(item.value)}</span>
                  </div>
                ))}
              </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <UtmList title="Vendas por Origem (UTM Source)" items={utmSourceData} status={utmStatus} />
            <UtmList title="Vendas por Campanha (UTM Campaign)" items={utmCampaignData} status={utmStatus} />
            <UtmList title="Vendas por Criativo (UTM Content)" items={utmContentData} status={utmStatus} />
          </div>
        </>
      )}
    </div>
  );
}

export default function LandingPageFunnel() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}
