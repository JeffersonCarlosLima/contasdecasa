# Contas da Casa

App web de finanças da família (substitui a planilha "Contas do mês"): salários e extras por mês,
investimento, despesas com dono/categoria/vencimento/parcelas/recorrência, dashboard com renda,
disponível, gasto, sobra e a divisão entre os membros.

Stack: Next.js 15 (App Router) · TypeScript estrito · PostgreSQL · Drizzle ORM · Better Auth ·
Tailwind v4 · Recharts · Vitest · pnpm.

> **Para quem vai desenvolver:** leia [`docs/README.md`](docs/README.md). As telas em
> [`docs/interfaces`](docs/interfaces/README.md) são **contrato de seguimento obrigatório à risca**.
> O plano de trabalho está em [`docs/tasks`](docs/tasks/README.md).

## Requisitos

- Node.js 22+ e pnpm 10 (`corepack enable`)
- Um PostgreSQL acessível, com um banco dedicado (ex.: `financas`)

## 1. Configurar o banco

Crie o banco uma vez no seu servidor (o app usa **um único banco**, schema `public`):

```sql
CREATE DATABASE financas;
```

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
# DATABASE_URL=postgres://usuario:senha@host:5432/financas
# BETTER_AUTH_SECRET=$(openssl rand -base64 32)
# BETTER_AUTH_URL=http://localhost:3000   APP_URL=http://localhost:3000
# SMTP_* é opcional: sem SMTP o link de convite aparece na tela para copiar.
```

## 2. Rodar em desenvolvimento

```bash
pnpm install
pnpm db:migrate     # aplica as migrations de drizzle/ no banco de DATABASE_URL
pnpm db:seed        # família de exemplo (2 membros + um mês de despesas) — ver docs/tasks/09-seed.md
pnpm dev            # http://localhost:3000
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm test` | Vitest (regras de cálculo em `src/lib/calc`) |
| `pnpm lint` / `pnpm typecheck` | ESLint e `tsc --noEmit` |
| `pnpm db:generate` | Gera nova migration a partir do schema (`src/db/schema`) |
| `pnpm db:migrate` | Aplica as migrations |
| `pnpm db:seed` | Dados de exemplo |
| `pnpm tokens` | Regenera `src/styles/tokens.css` de `docs/design/tokens.json` |

Mudou o schema? `pnpm db:generate`, revise o SQL em `drizzle/`, commite e rode `pnpm db:migrate`.

## 3. Publicar com Docker (ex.: CasaOS)

O `Dockerfile` e o `compose.yaml` cobrem só o app (porta 3000); o Postgres é externo.

```bash
cp .env.example .env            # DATABASE_URL apontando para o seu Postgres
docker compose run --rm migrate # aplica as migrations (perfil "tools")
docker compose up -d --build    # sobe o app em http://servidor:3000
```

No CasaOS, importe o `compose.yaml` como app personalizado e defina as variáveis do `.env`
(`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `APP_URL`). `BETTER_AUTH_URL`/`APP_URL`
devem ser a URL pela qual vocês acessam o app.

## Estrutura

```
src/app/            rotas (App Router)       src/components/ui/  componentes do design system
src/db/schema/      schema Drizzle           src/lib/calc/       regras de cálculo (puras, testadas)
drizzle/            migrations versionadas   docs/               specs, interfaces, design, tasks
```
