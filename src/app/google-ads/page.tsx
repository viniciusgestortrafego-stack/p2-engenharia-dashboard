"use client";

import { Suspense, useEffect, useState } from "react";
import { DollarSign, Activity, MousePointerClick, Percent, Target, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { StepFunnel } from "@/components/ui/StepFunnel";
import { TimelineChart } from "@/components/charts/TimelineChart";
import { GoogleAdsCampaignTable } from "@/components/ui/GoogleAdsCampaignTable";
import { GoogleAdsKeywordTable } from "@/components/ui/GoogleAdsKeywordTable";
import { GoogleAdsConversionList } from "@/components/ui/GoogleAdsConversionList";
import { useDateRange } from "@/lib/dateRange";
import { formatBRL, formatNumber, formatPercent, formatShortDate } from "@/lib/format";
import {
  GoogleAdsConversionRow,
  GoogleAdsFetchError,
  GoogleAdsKeywordRow,
  GoogleAdsRow,
  aggregateConversionBreakdown,
  aggregateGoogleAdsByCampaign,
  aggregateGoogleAdsByDay,
  aggregateGoogleAdsByKeyword,
  aggregateGoogleAdsRows,
  fetchGoogleAdsData,
  filterConversionsByRange,
  filterGoogleAdsRowsByRange,
  filterKeywordsByRange,
} from "@/lib/googleAds";
import { siteConfig } from "@/config/site";

function GoogleAdsContent() {
  const { from, to } = useDateRange();

  const [rows, setRows] = useState<GoogleAdsRow[]>([]);
  const [keywords, setKeywords] = useState<GoogleAdsKeywordRow[]>([]);
  const [conversionBreakdown, setConversionBreakdown] = useState<GoogleAdsConversionRow[]>([]);
  const [conversionActionNames, setConversionActionNames] = useState<string[]>([]);
  const [conversionActionCategories, setConversionActionCategories] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchGoogleAdsData()
      .then((data) => {
        setRows(data.rows);
        setKeywords(data.keywords);
        setConversionBreakdown(data.conversionBreakdown);
        setConversionActionNames(data.conversionActionNames);
        setConversionActionCategories(data.conversionActionCategories);
      })
      .catch((err) => setError(err instanceof GoogleAdsFetchError ? err.message : "Erro ao buscar dados do Google Ads"))
      .finally(() => setLoading(false));
  }, []);

  const periodRows = filterGoogleAdsRowsByRange(rows, from, to);
  const totals = aggregateGoogleAdsRows(periodRows);
  const campaignRows = aggregateGoogleAdsByCampaign(periodRows);
  const keywordRows = aggregateGoogleAdsByKeyword(filterKeywordsByRange(keywords, from, to));
  const conversionRowsWithActivity = aggregateConversionBreakdown(filterConversionsByRange(conversionBreakdown, from, to));
  // Show every configured conversion action (add to cart, begin checkout, purchase,
  // view_item, YouTube engagement, ...), not just the ones with activity in the
  // selected period — a goal at zero is still a goal worth seeing.
  const conversionRows = conversionActionNames.map(
    (name) => conversionRowsWithActivity.find((item) => item.name === name) || { name, conversions: 0, conversionValue: 0 }
  );
  const timelineData = aggregateGoogleAdsByDay(periodRows).map((point) => {
    const [year, month, day] = point.date.split("-").map(Number);
    return { date: formatShortDate(new Date(year, (month || 1) - 1, day || 1)), investimento: point.spend };
  });

  // E-commerce sales funnel: add-to-cart and begin-checkout are Google's standard
  // ecommerce conversion categories; purchase can be split across more than one
  // tracked action (e.g. a legacy tag alongside the WooCommerce plugin's own), so sum
  // every action in that category rather than relying on one exact name.
  const conversionsByCategory = (category: string) =>
    conversionRows
      .filter((item) => conversionActionCategories[item.name] === category)
      .reduce((acc, item) => ({ conversions: acc.conversions + item.conversions, conversionValue: acc.conversionValue + item.conversionValue }), { conversions: 0, conversionValue: 0 });

  const addToCart = conversionsByCategory("ADD_TO_CART");
  const beginCheckout = conversionsByCategory("BEGIN_CHECKOUT");
  const purchase = conversionsByCategory("PURCHASE");
  const roas = totals.spend > 0 ? purchase.conversionValue / totals.spend : 0;
  const costPer = (count: number) => (count > 0 ? totals.spend / count : 0);

  const funnelBase = totals.impressions || 1;
  const funnelSteps = [
    { label: "INVESTIMENTO", value: formatBRL(totals.spend), percentage: 100 },
    { label: "IMPRESSÕES", value: formatNumber(totals.impressions), subtext: `CPM ${formatBRL(totals.cpm)}`, percentage: 100 },
    { label: "CLIQUES", value: formatNumber(totals.clicks), subtext: `${formatPercent(totals.ctr)} CTR`, percentage: (totals.clicks / funnelBase) * 100 },
    { label: "CARRINHO", value: formatNumber(addToCart.conversions), subtext: `Custo ${formatBRL(costPer(addToCart.conversions))}`, percentage: (addToCart.conversions / funnelBase) * 100 },
    { label: "CHECKOUT", value: formatNumber(beginCheckout.conversions), subtext: `Custo ${formatBRL(costPer(beginCheckout.conversions))}`, percentage: (beginCheckout.conversions / funnelBase) * 100 },
    { label: "COMPRA", value: formatNumber(purchase.conversions), subtext: `ROAS ${roas.toFixed(2)}x`, percentage: (purchase.conversions / funnelBase) * 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">{siteConfig.clientName}</h1>
        <p className="text-gray-400">Google Ads</p>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400">Carregando...</div>
      ) : error ? (
        <div className="border border-red-500/30 rounded-xl bg-red-500/5 p-6 text-center text-red-400">{error}</div>
      ) : rows.length === 0 ? (
        <div className="border border-card-border rounded-xl bg-card p-6 text-center text-gray-400 space-y-2">
          <p>Nenhum dado recebido do Google Ads ainda.</p>
          <p className="text-sm">
            Coloque o ID da conta Google Ads em{" "}
            <a href="/settings" className="text-primary font-semibold hover:underline">Configurações</a>.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Investimento" value={formatBRL(totals.spend)} subtitle="valor usado no período" icon={<DollarSign size={18} />} />
            <MetricCard title="Impressões" value={formatNumber(totals.impressions)} subtitle="entregas no período" icon={<Activity size={18} />} />
            <MetricCard title="Cliques" value={formatNumber(totals.clicks)} subtitle="cliques no período" icon={<MousePointerClick size={18} />} />
            <MetricCard title="CTR" value={formatPercent(totals.ctr)} subtitle="cliques / impressões" icon={<Percent size={18} />} />
            <MetricCard title="CPC" value={formatBRL(totals.cpc)} subtitle="custo por clique" icon={<DollarSign size={18} />} />
            <MetricCard title="CPM" value={formatBRL(totals.cpm)} subtitle="custo por mil impressões" icon={<DollarSign size={18} />} />
            <MetricCard title="Adicionar ao Carrinho" value={formatNumber(addToCart.conversions)} subtitle={`custo ${formatBRL(costPer(addToCart.conversions))}`} icon={<Target size={18} />} />
            <MetricCard title="Iniciar Checkout" value={formatNumber(beginCheckout.conversions)} subtitle={`custo ${formatBRL(costPer(beginCheckout.conversions))}`} icon={<Target size={18} />} />
            <MetricCard title="Compras" value={formatNumber(purchase.conversions)} subtitle={`ticket médio ${formatBRL(purchase.conversions > 0 ? purchase.conversionValue / purchase.conversions : 0)}`} icon={<Target size={18} />} />
            <MetricCard title="Valor de Retorno de Vendas" value={formatBRL(purchase.conversionValue)} subtitle="receita gerada pelas compras" icon={<DollarSign size={18} />} />
            <MetricCard title="ROAS" value={`${roas.toFixed(2)}x`} subtitle="valor de compra / investimento" icon={<TrendingUp size={18} />} />
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Funil do Google Ads</h2>
            <StepFunnel steps={funnelSteps} />
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-2">Evolução Temporal</h2>
            <p className="text-sm text-gray-500 mb-4">Investimento por dia</p>
            {timelineData.length > 0 ? (
              <TimelineChart data={timelineData} dataKey="investimento" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">Sem dados no período selecionado</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Campanhas</h2>
              <GoogleAdsCampaignTable rows={campaignRows} />
            </div>
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Conversões Personalizadas</h2>
              <GoogleAdsConversionList items={conversionRows} />
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Palavras-chave</h2>
            <GoogleAdsKeywordTable rows={keywordRows} />
          </div>
        </>
      )}
    </div>
  );
}

export default function GoogleAdsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <GoogleAdsContent />
    </Suspense>
  );
}
