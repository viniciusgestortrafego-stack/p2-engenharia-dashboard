"use client";

import { Suspense, useEffect, useState } from "react";
import { Eye, UserPlus, Heart, Radar, UserCircle } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataStatus } from "@/components/ui/DataStatus";
import { MediaGrid } from "@/components/ui/MediaGrid";
import { useConfigStatus } from "@/lib/useConfigStatus";
import { useDateRange } from "@/lib/dateRange";
import { formatNumber } from "@/lib/format";
import { InstagramFetchError, InstagramMetrics, MediaPerformance, fetchInstagramMetrics, fetchRecentMedia } from "@/lib/instagram";

function InstagramContent() {
  const { status: configStatus, loaded } = useConfigStatus();
  const { from, to } = useDateRange();

  const [metrics, setMetrics] = useState<InstagramMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [media, setMedia] = useState<MediaPerformance[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    if (!loaded || !configStatus.hasInstagram) return;
    setLoading(true);
    setError(null);
    fetchInstagramMetrics({ instagramAccountId: configStatus.instagramAccountId, since: from, until: to })
      .then(setMetrics)
      .catch((err) => setError(err instanceof InstagramFetchError ? err.message : "Erro ao buscar dados do Instagram"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, configStatus.hasInstagram, configStatus.instagramAccountId, from, to]);

  useEffect(() => {
    if (!loaded || !configStatus.hasInstagram) return;
    setMediaLoading(true);
    setMediaError(null);
    fetchRecentMedia({ instagramAccountId: configStatus.instagramAccountId })
      .then(setMedia)
      .catch((err) => setMediaError(err instanceof InstagramFetchError ? err.message : "Erro ao buscar conteúdos do Instagram"))
      .finally(() => setMediaLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, configStatus.hasInstagram, configStatus.instagramAccountId]);

  const status = DataStatus({
    configured: configStatus.hasInstagram,
    loading,
    error,
    configureMessage: "Configure o ID da conta do Instagram em Configurações para ver os números do perfil.",
  });

  const mediaStatus = DataStatus({
    configured: configStatus.hasInstagram,
    loading: mediaLoading,
    error: mediaError,
    configureMessage: "Configure o ID da conta do Instagram em Configurações para ver os conteúdos.",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Instagram</h1>
        <p className="text-gray-400">Números da conta no período selecionado</p>
      </div>

      {status ?? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="Visualizações" value={formatNumber(metrics?.views ?? 0)} subtitle="conteúdo visualizado" icon={<Eye size={18} />} />
          <MetricCard title="Seguidores" value={formatNumber(metrics?.followerChange ?? 0)} subtitle="variação líquida no período" icon={<UserPlus size={18} />} />
          <MetricCard title="Interações" value={formatNumber(metrics?.interactions ?? 0)} subtitle="curtidas, comentários, envios e salvamentos" icon={<Heart size={18} />} />
          <MetricCard title="Contas Alcançadas" value={formatNumber(metrics?.reach ?? 0)} subtitle="perfis únicos que viram o conteúdo" icon={<Radar size={18} />} />
          <MetricCard title="Visitas ao Perfil" value={formatNumber(metrics?.profileViews ?? 0)} subtitle="visitas diretas no perfil" icon={<UserCircle size={18} />} />
        </div>
      )}

      <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
        <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Últimos Conteúdos</h2>
        {mediaStatus ?? <MediaGrid items={media} />}
      </div>
    </div>
  );
}

export default function InstagramPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <InstagramContent />
    </Suspense>
  );
}
