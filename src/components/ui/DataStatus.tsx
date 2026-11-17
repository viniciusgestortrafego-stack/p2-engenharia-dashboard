import Link from "next/link";

interface DataStatusProps {
  configured: boolean;
  loading: boolean;
  error: string | null;
  configureMessage: string;
}

export function DataStatus({ configured, loading, error, configureMessage }: DataStatusProps) {
  if (!configured) {
    return (
      <div className="border border-card-border rounded-xl bg-card p-6 text-center text-gray-400 space-y-2">
        <p>{configureMessage}</p>
        <Link href="/settings" className="text-primary font-semibold hover:underline">
          Ir para Configurações
        </Link>
      </div>
    );
  }
  if (loading) {
    return <div className="border border-card-border rounded-xl bg-card p-6 text-center text-gray-400">Carregando dados...</div>;
  }
  if (error) {
    return <div className="border border-red-500/30 rounded-xl bg-red-500/5 p-6 text-center text-red-400">{error}</div>;
  }
  return null;
}
