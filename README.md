# ReverteMed · Front

**TanStack Start** (Vite + TanStack Router) com React 19, Tailwind v4, TanStack Query (Suspense), Zustand (estado global) e nuqs (estado na URL).

```bash
bun install
cp .env.example .env.local     # VITE_API_URL e API_URL apontam para a API Go
bun --bun run dev              # http://localhost:3000
bun --bun run build && bun run start   # produção (SSR) em :3000
```

## Renderização
- **Páginas públicas em SSR**: `/`, `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/verificar-email`.
- **Área logada em CSR** (`ssr: false` no layout `_app`): `/home`, `/glosas/*`, `/autorizacoes/*`, `/recebiveis/*`, `/diagnostico`, `/configuracoes`.

## Autenticação (BFF)
O refresh token **nunca chega ao JavaScript**: as server functions (`src/server/auth.ts`) chamam a API e o guardam em cookie `httpOnly`. O access token (15 min) fica só em memória (`stores/auth.ts`); o cliente (`lib/api.ts`) renova de forma transparente ao receber 401 (rotação + deduplicação). Ao recarregar a página a sessão é restaurada pelo cookie.

## Organização
```
src/
  routes/          rotas por arquivo (públicas na raiz; logadas em _app/)
  components/ui    design system (Button, Badge, Card, Kpi, Table, Modal…)
  components/app   shell (sidebar/topbar), gráficos, estados (Boundary, erro, 404)
  features/        componentes de domínio compartilhados (uploader TISS, seletor de operadora)
  lib/             api client, formatação, rótulos, tipos da API, hooks de query (useGet/useAct)
  stores/          Zustand (auth, toasts)
  server/          server functions (auth BFF)
```

Dados com `useSuspenseQuery` dentro de `<Boundary>` (Suspense + error boundary por seção). Filtros, abas, página e seleções ficam na URL via **nuqs** (compartilháveis e com botão voltar).
