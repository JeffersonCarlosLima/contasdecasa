# 03 · Dashboard — `/`

Protótipo: `docs/design/telas/Main.dc.html` (celular: mesma tela a 390px). Ordem **fixa** dos blocos
(`docs/design/README.md`, "Dashboard: ordem fixa"). Conteúdo dentro de `cc-wrap` (gap 32px).

## 1. Topo (`cc-top`)

- Esquerda: label `cc-muted` **"Visão do mês"** e `display` com o mês por extenso: **"Novembro 2026"**.
- Direita: `MonthSwitcher` (‹ rótulo ›) com `aria-label` "Mês anterior" / "Próximo mês". Mês fechado
  mostra "Fechado" ao lado.

## 2. Filtro "Ver dados de" (`role=group`)

Chips: **Família toda** (avatares sobrepostos de todos os membros; padrão, `aria-pressed=true`) +
um chip por membro (avatar + nome). Filtra todos os blocos abaixo.

## 3. KPIs (`cc-kpis`, `aria-label="Indicadores do mês"`), nesta ordem

| KPI | Label | Valor | Linha de apoio | Tom |
| --- | --- | --- | --- | --- |
| 1 | Renda do mês | R$ | "{n} salários + extra" | neutro |
| 2 | Investimento | R$ | "{x}% da renda" | `cc-kpi--invest` |
| 3 | Disponível | R$ | "Renda − investimento" | neutro |
| 4 | Gasto | R$ | "{R$} pendentes" | neutro |
| 5 | Sobra | R$ | "Livre até o fim do mês" | `--positive` ou `--negative` |

Celular: grade de 2 colunas, Renda ocupa a linha inteira; valor em 22/28.

## 4. "Para onde vai a renda de {mês}" (`cc-card cc-budget`)

Título `title`. Barra `BudgetBar` com segmentos **Investido** (`invest`), **Pago** (`paid`),
**Pendente** (`pending`) em % da renda; o trecho livre é o trilho. `role=img` com `aria-label`
descrevendo as porcentagens. Legenda: "Investido **R$**", "Pago **R$**", "Pendente **R$**", "Livre **R$**".
Livre negativo: barra cheia e excesso em `--danger` na legenda.

## 5. Grade de 2 colunas (`cc-grid2`, uma coluna no celular)

- **Gastos por pessoa** — título + caption "Quem é dono da despesa". Linha `cc-cat` por membro e
  por "Família": nome com avatar, barra (`--person-*`/`--family`), valor. Membro sem gastos: "R$ 0,00" em muted.
- **Gastos por categoria** — título + caption "R$ {total} no total". Linhas `cc-cat` com ponto
  `chart-*`, nome, barra, valor; mais de 6 categorias → "Outras" em `chart-6`. Ordem decrescente de valor.
- **Quanto cada um paga** — título + botão ghost sm **"Regras"** (→ `/mes`). Caption com a regra em
  texto ("Despesas próprias + parte das despesas da família (R$ …), dividida proporcional ao salário
  entre Jefferson e Lorrane."). Barra empilhada de divisão (`person-*`). Uma `cc-person-row` por membro
  **que participa da divisão** (nome, caption "R$ … próprias + R$ … da família · pagou R$ …", total à
  direita); dependente fora da divisão aparece com "Dependente · fora da divisão" e R$ 0,00 em muted.
  Quando houver acerto: "{Fulano} deve R$ X a {Beltrano}".

## 6. "Próximos vencimentos"

Título + botão ghost sm **"Ver todas"** (→ `/despesas`). Lista `cc-list` de `ExpenseRow` (até 5):
ponto da categoria, título, meta (avatar + dono · "venceu 03/11" | "vence 12/11" · parcela "7 de 8" ·
observação), valor e `StatusBadge`. Atrasadas primeiro, depois por vencimento.

## Estado vazio

"Nenhuma despesa em {mês}. Lance a primeira ou copie as recorrentes do mês passado." com botões
**Lançar despesa** (primário) e **Copiar recorrentes** (secundário).
