# 05 · Rotas

`/entrar`, `/cadastro`, `/convite/[token]`, `/criar-familia`, `/` (dashboard), `/despesas`,
`/despesas/nova`, `/despesas/[id]`, `/mes` (fechamento), `/familia`, `/tipos`, `/conta`.
`/api/auth/[...all]` é o Better Auth. O mês ativo vai na URL: `?mes=2026-11` (padrão: mês atual em
`America/Araguaina`). Layouts: `(auth)` sem casca; `(app)` com casca (menu lateral / barra inferior).
Rotas do grupo `(app)` redirecionam: sem sessão → `/entrar`; sem família → `/criar-familia`.

Dashboard: seletor de mês; filtro "Família toda / cada membro"; KPIs Renda, Investimento, Disponível,
Gasto, Sobra; barra de para onde vai a renda; gastos por categoria; "Quanto cada um paga" (todos que
participam da divisão); gastos por pessoa; próximos vencimentos. Detalhes em `docs/interfaces/03-dashboard.md`.
