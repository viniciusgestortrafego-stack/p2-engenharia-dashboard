"use client";

import { LayoutDashboard, MousePointerClick, Image as ImageIcon, Camera, Users, Search, Settings, Sun, Moon, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { siteConfig } from '@/config/site';

export default function Sidebar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="w-64 bg-card border-r border-card-border flex flex-col h-screen shrink-0 transition-colors">
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-6 border-b border-card-border">
        <Image src="/logo.png" alt={siteConfig.agencyName} width={48} height={48} className="w-12 h-12 object-contain shrink-0" priority />
        <span className="font-bold text-lg text-foreground text-center leading-tight">{siteConfig.agencyName}</span>
      </div>
      
      <nav className="flex-1 p-4 flex flex-col gap-2">
        <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Meta Ads" />
        <NavItem href="/landing-page" icon={<MousePointerClick size={20} />} label="Funil de Vendas" />
        <NavItem href="/google-ads" icon={<Search size={20} />} label="Google Ads" />
        <NavItem href="/analytics" icon={<BarChart3 size={20} />} label="Analytics" />
        <NavItem href="/captacao-leads" icon={<Users size={20} />} label="Captação de Leads" />
        <NavItem href="/criativos" icon={<ImageIcon size={20} />} label="Criativos" />
        <NavItem href="/instagram" icon={<Camera size={20} />} label="Instagram" />
      </nav>

      <div className="p-4 border-t border-card-border space-y-2">
        <NavItem href="/settings" icon={<Settings size={20} />} label="Configurações" />
        
        {mounted && (
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium text-sm">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}
