# KpiCard

Card de indicador do mês: rótulo, valor em R$ e uma linha de comparação.

**Recebe:** rótulo, valor em centavos, linha de apoio opcional (comparação com o mês anterior ou explicação do cálculo), tom (`neutro | invest | positive | negative`).

**Classes:** `cc-card cc-kpi` (+ `cc-kpi--invest | --positive | --negative`) > `cc-kpi__label`, `cc-kpi__value`, `cc-kpi__delta`. Agrupe em `cc-kpis`.

- Ordem fixa no dashboard: Renda, Investimento (`--invest`), Disponível, Gasto, Sobra (`--positive` ou `--negative` conforme o sinal).
- A linha de apoio explica, não enfeita: "Renda − investimento", "R$ 1.212,00 ainda pendentes".
- Sem gráfico dentro do card; tendências ficam no gráfico de evolução.
