"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import { emptyCredentials } from "@/lib/credentials";

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      if (!response.ok) {
        setError("Usuário ou senha inválidos");
        return;
      }
      onLoggedIn();
    } catch {
      setError("Erro ao entrar. Tenta de novo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-8 shadow-sm space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Usuário</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoFocus
            className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export function SettingsForm() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [formData, setFormData] = useState(emptyCredentials);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const loadCredentials = () => {
    fetch("/api/credentials")
      .then((res) => {
        if (!res.ok) {
          setAuthenticated(false);
          return null;
        }
        setAuthenticated(true);
        return res.json();
      })
      .then((data) => {
        if (data) setFormData({ ...emptyCredentials, ...data });
      })
      .catch(() => setAuthenticated(false));
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Erro ao salvar. Tenta de novo.");
    }
  };

  const handleClear = async () => {
    setSaveError(null);
    try {
      const response = await fetch("/api/credentials", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setFormData(emptyCredentials);
      setSaved(false);
    } catch {
      setSaveError("Erro ao limpar. Tenta de novo.");
    }
  };

  const handleGenerateSecret = () => {
    const secret = crypto.randomUUID().replace(/-/g, "");
    setFormData({ ...formData, googleAdsWebhookSecret: secret });
    setSaved(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setFormData(emptyCredentials);
    setAuthenticated(false);
  };

  if (authenticated === null) {
    return <div className="max-w-3xl text-gray-400">Carregando...</div>;
  }

  if (!authenticated) {
    return <LoginForm onLoggedIn={loadCredentials} />;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-gray-400">credenciais e integrações</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-foreground transition-colors"
        >
          <LogOut size={16} /> Sair
        </button>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Credenciais</h2>
          <p className="text-sm text-gray-500">
            Salvas no servidor e usadas por todas as páginas do dashboard. Os campos secretos nunca chegam ao navegador de quem só está vendo os dados — só quem loga aqui consegue vê-los ou alterá-los.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">System User Token - Meta</label>
            <input
              type="password"
              name="metaToken"
              value={formData.metaToken}
              onChange={handleChange}
              placeholder="EAA..."
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-primary/70">
              Business Manager → Usuários do sistema → Gerar novo token
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID da Conta de Anúncios</label>
            <input
              type="text"
              name="adAccountId"
              value={formData.adAccountId}
              onChange={handleChange}
              placeholder="act_123456789"
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-primary/70">
              URL do Gerenciador, após "act="
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID da Conta do Instagram</label>
            <input
              type="text"
              name="instagramAccountId"
              value={formData.instagramAccountId}
              onChange={handleChange}
              placeholder="17841400..."
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-primary/70">
              ID da conta profissional do Instagram vinculada à Página do Facebook (Meta Business Suite → Configurações → Contas)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID da conta - Google Ads</label>
            <input
              type="text"
              name="googleAdsCustomerId"
              value={formData.googleAdsCustomerId}
              onChange={handleChange}
              placeholder="123-456-7890"
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-primary/70">Número da conta no topo do Google Ads (com ou sem traços)</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Propriedade - Google Analytics (GA4)</label>
            <input
              type="text"
              name="ga4PropertyId"
              value={formData.ga4PropertyId}
              onChange={handleChange}
              placeholder="123456789"
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-primary/70">GA4 → Administrador → Detalhes da propriedade → ID da propriedade</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">URL da Loja - WooCommerce</label>
            <input
              type="text"
              name="wooStoreUrl"
              value={formData.wooStoreUrl}
              onChange={handleChange}
              placeholder="https://minhaloja.com.br"
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-primary/70">Usada pra puxar as UTMs de venda no Funil de Vendas</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consumer Key - WooCommerce</label>
            <input
              type="password"
              name="wooConsumerKey"
              value={formData.wooConsumerKey}
              onChange={handleChange}
              placeholder="ck_..."
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-primary/70">WordPress → WooCommerce → Configurações → Avançado → REST API</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consumer Secret - WooCommerce</label>
            <input
              type="password"
              name="wooConsumerSecret"
              value={formData.wooConsumerSecret}
              onChange={handleChange}
              placeholder="cs_..."
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-primary/70">Chave gerada junto com a Consumer Key (permissão de leitura já basta)</p>
          </div>

          <div className="space-y-2 pt-6 border-t border-card-border">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Google Ads — URL do Webhook</label>
            <input
              type="text"
              readOnly
              value={origin ? `${origin}/api/google-ads/ingest` : ""}
              onFocus={(e) => e.target.select()}
              className="w-full bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white/70 focus:outline-none"
            />
            <p className="text-xs text-primary/70">Cole essa URL no script do Google Ads (UrlFetchApp)</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Google Ads — Chave do Webhook</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={formData.googleAdsWebhookSecret}
                onFocus={(e) => e.target.select()}
                placeholder="Clique em gerar →"
                className="flex-1 bg-[#0d0d12] border border-card-border rounded-lg px-4 py-3 text-white/70 focus:outline-none"
              />
              <button
                onClick={handleGenerateSecret}
                className="shrink-0 bg-transparent border border-card-border hover:bg-white/5 text-white px-4 rounded-lg font-semibold transition-colors"
              >
                Gerar nova
              </button>
            </div>
            <p className="text-xs text-primary/70">Cole essa chave no script como cabeçalho Authorization: Bearer — gerar uma nova invalida a antiga</p>
          </div>

          <div className="pt-6 flex items-center gap-4 border-t border-card-border">
            <button
              onClick={handleSave}
              className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm"
            >
              Salvar
            </button>
            <button
              onClick={handleClear}
              className="bg-transparent border border-card-border hover:bg-white/5 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Limpar
            </button>
            {saved && (
              <span className="text-green-500 font-medium text-sm">Salvo com sucesso!</span>
            )}
            {saveError && (
              <span className="text-red-500 font-medium text-sm">{saveError}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
