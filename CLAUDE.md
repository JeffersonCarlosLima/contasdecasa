# Contas da Casa — instruções para agentes

App web de finanças da família. Interface em pt-BR. **Leia `docs/README.md` primeiro.**

- Skill de construção: `.claude/skills/construir-contas-da-casa/SKILL.md` (siga-a).
- **As interfaces em `docs/interfaces/` são contrato e devem ser seguidas à risca**, junto com os protótipos
  em `docs/design/telas/` e o design system em `docs/design/`. Desvios exigem aprovação do Jefferson.
- Stack fixa (Next 15, TS estrito, Drizzle, PostgreSQL único em `DATABASE_URL`, Better Auth, Zod, Tailwind v4,
  Recharts, Vitest, pnpm). Não troque sem perguntar. Não invente requisitos: pergunte.
- Dinheiro sempre em centavos inteiros; toda consulta filtra por `family_id`; família/papel vêm da sessão.
- Antes de concluir uma etapa: `pnpm test && pnpm lint && pnpm typecheck`.
- Plano e status: `docs/tasks/README.md`.
