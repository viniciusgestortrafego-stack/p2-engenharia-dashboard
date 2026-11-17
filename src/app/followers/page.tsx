"use client";

import { MetricCard } from "@/components/ui/MetricCard";
import { DollarSign, MousePointerClick, Activity, UserPlus } from "lucide-react";
import { StepFunnel } from "@/components/ui/StepFunnel";
import { DonutChart } from "@/components/charts/DonutChart";
import { TimelineChart } from "@/components/charts/TimelineChart";

const funnelSteps = [
  { label: "INVESTIMENTO", value: "R$ 9,35", percentage: 100 },
  { label: "IMPRESSÕES", value: "1.067", subtext: "CPM R$ 8,76", percentage: 80 },
  { label: "CLIQUES", value: "77", subtext: "7,2% CTR", percentage: 20 },
  { label: "VISITAS NO PERFIL", value: "73", subtext: "Custo R$ 0,13", percentage: 18 },
];

const pieData = [
  { name: 'HOT', value: 0, color: 'var(--primary)' },
  { name: 'COLD', value: 73, color: '#3b82f6' }
];

const timelineData = [
  { date: '30/06', visitas: 20 },
  { date: '01/07', visitas: 52 },
];

export default function FollowersFunnel() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Win Leilões</h1>
          <p className="text-gray-400">Funil de Seguidores</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-card-border p-3 rounded-xl w-fit overflow-x-auto">
          <button className="px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Hoje</button>
          <button className="px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Ontem</button>
          <button className="px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">3 dias</button>
          <button className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium shadow-sm">7 dias</button>
          <button className="px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">30 dias</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Investimento" value="R$ 9,35" subtitle="valor usado no período" icon={<DollarSign size={18} />} />
        <MetricCard title="Visitas no Perfil" value="73" subtitle="visitas ao perfil do IG" icon={<UserPlus size={18} />} />
        <MetricCard title="Custo/Visita" value="R$ 0,13" subtitle="investimento / visitas" icon={<DollarSign size={18} />} />
        <MetricCard title="Impressões" value="1.067" subtitle="entregas no período" icon={<Activity size={18} />} />
        <MetricCard title="Cliques" value="77" subtitle="cliques no link" icon={<MousePointerClick size={18} />} />
        <MetricCard title="CPC" value="R$ 0,12" subtitle="custo por clique" icon={<DollarSign size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Funil de Seguidores</h2>
          <StepFunnel steps={funnelSteps} />
        </div>
        
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm flex flex-col">
          <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-6">Públicos HOT vs COLD</h2>
          <DonutChart data={pieData} total={73} />
          
          <div className="w-full space-y-3 mt-4">
             <div className="flex justify-between items-center text-sm border-b border-card-border pb-2">
                <span className="text-primary font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary inline-block"></span> HOT
                </span>
                <span className="font-bold">0%</span>
             </div>
             <div className="flex justify-between items-center text-sm pb-2">
                <span className="text-blue-500 font-bold flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> COLD
                </span>
                <span className="font-bold">100%</span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
         <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-2">Evolução Temporal</h2>
         <p className="text-sm text-gray-500 mb-4">Visitas no perfil por dia</p>
         <TimelineChart data={timelineData} dataKey="visitas" color="#eab308" />
      </div>
    </div>
  );
}
