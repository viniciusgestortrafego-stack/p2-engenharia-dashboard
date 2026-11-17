// O nome do cliente vem da variável NEXT_PUBLIC_CLIENTE_NOME, que o Sistema Genius
// grava ao criar a dashboard (projeto genius-<cliente> na Vercel).
const clientName = process.env.NEXT_PUBLIC_CLIENTE_NOME?.trim() || "P2 Engenharia";

export const siteConfig = {
  agencyName: "Genius Assessoria Digital",
  clientName,
  subtitle: "central de performance",
  browserTitle: `Dashboard ${clientName}`,
};
