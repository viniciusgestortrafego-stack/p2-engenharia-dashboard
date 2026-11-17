"use client";

import { siteConfig } from "@/config/site";
import { useDateRange } from "@/lib/dateRange";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { from: defaultFrom, to: defaultTo } = useDateRange();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from);
    params.set("to", to);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="h-20 bg-background border-b border-card-border flex items-center justify-between px-6 shrink-0">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">{siteConfig.clientName}</h1>
        <span className="text-xs text-gray-400">{siteConfig.subtitle}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-card border border-card-border px-4 py-2 rounded-lg text-sm text-gray-300 flex items-center gap-2 shadow-sm">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-transparent focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-transparent focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        <button
          onClick={handleApply}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          Aplicar
        </button>
      </div>
    </header>
  );
}
