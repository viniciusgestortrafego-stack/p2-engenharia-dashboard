# Dashboard P2 Engenharia (Genius Assessoria Digital)

Modelo das dashboards dos clientes da Genius Assessoria Digital (Meta Ads, Funil de Vendas, Google Ads, Analytics,
Captação de Leads, Criativos, Instagram). O **Sistema Genius** cria um projeto `genius-<cliente>` na Vercel a partir
deste repositório quando um cliente novo é cadastrado. Uma mudança aqui chega a todas as dashboards criadas por ele
(as antigas, publicadas à mão, não são afetadas).

## Variáveis do projeto (gravadas pelo sistema)

- `NEXT_PUBLIC_CLIENTE_NOME`: nome que aparece na dashboard.
- `SETTINGS_AUTH_USER` / `SETTINGS_AUTH_PASSWORD`: login da tela Configurações.
- `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`,
  `GOOGLE_ADS_LOGIN_CUSTOMER_ID`: chaves do Google Ads da agência. `GOOGLE_ANALYTICS_REFRESH_TOKEN`: GA4 (opcional).
- `BLOB_READ_WRITE_TOKEN`: armazenamento das Configurações (criado junto com o projeto).

## Depois de criada

Abra `/settings`, entre com o login padrão e coloque: token e conta de anúncio da Meta, conta do Instagram, ID da conta
Google Ads e propriedade do GA4. Módulo sem conta mostra o aviso para configurar.

## Rodar local

`npm install` e `npm run dev`.
