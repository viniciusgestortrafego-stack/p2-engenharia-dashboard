export interface SalesRow {
  date: string;
  dateObj: Date | null;
  investimento: number;
  custoPorCompra: number;
  compras: number;
  receita: number;
  roas: number;
  cliques: number;
  impressoes: number;
  visitasLP: number;
  checkoutsIniciados: number;
  ctr: number;
  cpm: number;
  connectRate: number;
  taxaConversaoCheckout: number;
  cpc: number;
}

export interface SalesBaseMetrics {
  investimento: number;
  compras: number;
  receita: number;
  impressoes: number;
  cliques: number;
  visitasLP: number;
  checkoutsIniciados: number;
}

export interface SalesDerivedMetrics {
  custoPorCompra: number;
  roas: number;
  ctr: number;
  cpm: number;
  cpc: number;
  connectRate: number;
  taxaConversaoCheckout: number;
}

export function deriveSalesMetrics({ investimento, compras, receita, impressoes, cliques, visitasLP, checkoutsIniciados }: SalesBaseMetrics): SalesDerivedMetrics {
  return {
    custoPorCompra: compras > 0 ? investimento / compras : 0,
    roas: investimento > 0 ? receita / investimento : 0,
    ctr: impressoes > 0 ? (cliques / impressoes) * 100 : 0,
    cpm: impressoes > 0 ? (investimento / impressoes) * 1000 : 0,
    cpc: cliques > 0 ? investimento / cliques : 0,
    connectRate: cliques > 0 ? (visitasLP / cliques) * 100 : 0,
    taxaConversaoCheckout: visitasLP > 0 ? (checkoutsIniciados / visitasLP) * 100 : 0,
  };
}

export function filterRowsByRange(rows: SalesRow[], from?: string, to?: string): SalesRow[] {
  if (!from && !to) return rows;
  const fromDate = from ? new Date(`${from}T00:00:00`) : null;
  const toDate = to ? new Date(`${to}T23:59:59`) : null;
  return rows.filter((row) => {
    if (!row.dateObj) return false;
    if (fromDate && row.dateObj < fromDate) return false;
    if (toDate && row.dateObj > toDate) return false;
    return true;
  });
}

export type SalesTotals = SalesBaseMetrics & SalesDerivedMetrics;

export function aggregateSalesRows(rows: SalesRow[]): SalesTotals {
  const base: SalesBaseMetrics = {
    investimento: rows.reduce((acc, row) => acc + row.investimento, 0),
    compras: rows.reduce((acc, row) => acc + row.compras, 0),
    receita: rows.reduce((acc, row) => acc + row.receita, 0),
    impressoes: rows.reduce((acc, row) => acc + row.impressoes, 0),
    cliques: rows.reduce((acc, row) => acc + row.cliques, 0),
    visitasLP: rows.reduce((acc, row) => acc + row.visitasLP, 0),
    checkoutsIniciados: rows.reduce((acc, row) => acc + row.checkoutsIniciados, 0),
  };

  return { ...base, ...deriveSalesMetrics(base) };
}
