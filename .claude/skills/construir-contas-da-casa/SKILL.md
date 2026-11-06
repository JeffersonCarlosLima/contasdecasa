---
name: construir-contas-da-casa
description: Como construir e evoluir o app Contas da Casa (Next.js + Drizzle + Better Auth) seguindo as specs, as interfaces à risca e as regras de cálculo. Use ao implementar qualquer tela, action, migration ou regra de negócio deste repositório.
---

# Construir o Contas da Casa

App web de finanças da família (substitui a planilha "Contas do mês"). Interface e textos em pt-BR.

## Antes de qualquer coisa

1. Leia `docs/README.md`, a spec relevante em `docs/specs/` e a tarefa em `docs/tasks/`.
2. Se vai mexer em tela: abra `docs/interfaces/<tela>.md`, o protótipo `docs/design/telas/*.dc.html` e os
   componentes em `docs/design/componentes/`. **As interfaces são contrato: siga à risca** (layout, textos,
   ordem dos blocos, estados, celular a 390px). Não "melhore" nem invente; desvio só com aprovação do Jefferson.
3. Não invente requisitos. Se algo não está nas specs, pergunte (premissas abertas: `docs/specs/06-decisoes.md`).

## Stack (não trocar sem perguntar)

Next.js 15 App Router + Server Components + Server Actions · TypeScript estrito · Drizzle ORM + drizzle-kit
(migrations em `drizzle/`) · PostgreSQL externo, **um banco** via `DATABASE_URL`, schema `public` (inclusive
auth) · Better Auth email/senha · Zod · Tailwind v4 · Recharts · Vitest · pnpm.

## Regras inegociáveis

- **Dinheiro em centavos inteiros** (`bigint` mode number). Nunca float. Percentuais em pontos-base.
  Formate só na borda com `formatBRL` (`R$ 1.234,56`, negativo `−R$`); entrada com `parseBRL`.
- **Multi-tenant:** toda tabela de negócio tem `family_id` e **toda consulta filtra por ele**. Família, membro
  e papel vêm da sessão no servidor (`src/lib/session.ts`), **nunca** do cliente.
- **Toda Server Action/rota:** valida sessão → resolve membro/família → checa papel → valida entrada com Zod
  → só então toca o banco. Mês fechado é somente leitura.
- Permissões: `membro` lança/edita as próprias e as da Família; `admin`/`dono` editam as dos outros, membros,
  fechamento e cadastros; só `dono` exclui a família/transfere posse.
- "Atrasado" não é coluna: pendente com vencimento antes de hoje, fuso `America/Araguaina` (`lib/dates`).
- Regras de cálculo ficam em `src/lib/calc` (funções puras) com testes. Não duplique cálculo em componentes.
- Convite: token aleatório, só o **hash** no banco, expira em 7 dias. Recuperação de senha está fora do MVP.

## Design

- Cores/espaços/raios só por tokens CSS (`var(--…)`); fonte da verdade `docs/design/tokens.json` →
  `pnpm tokens` gera `src/styles/tokens.css`. Nunca hex solto.
- Reuse as classes `cc-*` (`src/styles/components.css`, `layout.css`) e os componentes de `src/components/ui`.
  Crie o componente que faltar no mesmo padrão (props enxutas, classes `cc-`).
- Status sempre **Pago / Pendente / Atrasado** com ícone + palavra; pessoa sempre com avatar de inicial;
  um botão primário por tela; foco visível; alvos ≥ 40px; breakpoint 760px.
- Textos: voz do `docs/design/README.md` (você, frases curtas, verbos diretos, sem emoji).

## Fluxo de trabalho por etapa

Ordem: schema/migrations → auth → família e convites → cadastros → fechamento → despesas → dashboard → Docker.

1. Marque a tarefa em `docs/tasks/` e implemente o mínimo da etapa.
2. Schema mudou? `pnpm db:generate`, revise o SQL, `pnpm db:migrate` num banco de teste.
3. Regra nova? teste primeiro em `src/lib/calc/*.test.ts`.
4. Tela? compare com o protótipo em desktop e celular (Playwright/screenshot) antes de dar por pronta.
5. Rode `pnpm test && pnpm lint && pnpm typecheck` (e `pnpm build` ao fim de cada etapa).
6. Commit pequeno por etapa, mensagem em português descrevendo o porquê.

## Armadilhas já conhecidas

- Better Auth usa ids `text`; tabelas de negócio usam `uuid` (FK de `family_members.user_id` é `text`).
- `pnpm` usa `node-linker=hoisted` (`.npmrc`) por causa do `eslint-config-next`.
- `server-only` em `src/db/index.ts`: scripts (`migrate`, `seed`) usam conexão própria, não importam `@/db`.
- O resumo de acerto usa só despesas **pagas** (como o protótipo "Pelo que já foi pago, X deve R$ Y a Z").
- Valor da despesa parcelada é o de **cada parcela**.
