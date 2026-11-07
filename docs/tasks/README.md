# Plano de execução

Ordem de implementação (pedida pelo Jefferson): schema + migrations → auth → família e convites →
cadastros → fechamento → despesas → dashboard → Docker. Commits pequenos por etapa; rode
`pnpm test && pnpm lint && pnpm typecheck` a cada etapa.

**Cada tarefa de UI só termina quando a tela confere com `docs/interfaces/<tela>.md` e o protótipo
(`docs/design/telas`) — layout, textos, ordem, estados e celular.** Veja a skill
`.claude/skills/construir-contas-da-casa/SKILL.md`.

| # | Etapa | Status |
| --- | --- | --- |
| 00 | [Fundação do projeto](00-fundacao.md) | feito |
| 01 | [Schema e migrations](01-schema.md) | feito (revisar com o Jefferson) |
| 02 | [Autenticação](02-auth.md) | feito (no ar) |
| 03 | [Família e convites](03-familia-convites.md) | feito (no ar) |
| 04 | [Cadastros: tipos e formas de pagamento](04-cadastros.md) | feito (no ar) |
| 05 | [Fechamento do mês](05-fechamento.md) | feito (no ar) |
| 06 | [Despesas](06-despesas.md) | em andamento |
| 07 | [Dashboard](07-dashboard.md) | em andamento |
| 08 | [Docker, README e acabamento](08-docker-qualidade.md) | deploy no Oracle feito; falta /api/health e acessibilidade |
| 09 | [Seed](09-seed.md) | em revisão |

Itens abertos para o Jefferson decidir: ver `docs/specs/06-decisoes.md` (premissas "confirmar") e
`docs/interfaces/09-telas-sem-prototipo.md`.
