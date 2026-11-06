# Contas da Casa — documentação

Substitui a planilha "Contas do mês" por um app web de finanças da família.

| Pasta | Conteúdo |
| --- | --- |
| [`specs/`](specs/) | Especificação: visão, dados, regras de cálculo, auth/permissões, fluxos, rotas, decisões |
| [`interfaces/`](interfaces/) | **Contrato de interface, de seguimento obrigatório à risca** (uma doc por tela) |
| [`design/`](design/) | Design system (tokens, CSS, componentes) e protótipos HTML das telas |
| [`tasks/`](tasks/) | Plano de execução por etapa, com checklist |
| [`../.claude/skills/`](../.claude/skills/) | Skill de construção do projeto |

Ordem de leitura para quem vai desenvolver: `specs/00-visao.md` → `specs/01-dados.md` →
`specs/02-regras-calculo.md` → `interfaces/README.md` → `tasks/README.md`.
