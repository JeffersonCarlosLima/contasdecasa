# 04 · Despesas — `/despesas`

Protótipo: `docs/design/telas/Despesas.dc.html`.

## Topo

- Título `heading` **"Despesas da família"** (oculto no celular — o título vai no cabeçalho `cc-mtop`).
- Apoio `body cc-muted`: "{n} lançamentos · R$ {total} · R$ {pendente} pendentes".
- Direita: `MonthSwitcher` e botão primário **"Lançar despesa"** (`cc-hide-sm`; no celular vale o botão central da barra).

## Aviso pós-importação (`?mes=YYYY-MM&lote=<id>`)

Quando a tela é aberta após a confirmação de um lote de importação (com parâmetros `mes=YYYY-MM&lote=<id>`):
- Banner no topo (estilo `cc-card` ou `var(--surface-raised)`, `role="status"`):
  - Informa a quantidade de despesas criadas no mês exibido (ex.: "{n} despesas importadas neste mês").
  - Se houver despesas criadas em outros meses da fatura/extrato, lista esses outros meses com link/atalho direto para cada um (ex.: "Outras {m} despesas em {mês}").
  - Informa a quantidade de receitas e salários enviados para a composição da renda em `/mes` (com link direto para `/mes?mes=YYYY-MM`).
- O aviso pode ser fechado/dispensado pelo usuário e não impede a filtragem normal da lista.

## Filtros

1. Linha 1: controle segmentado **Por pessoa | Por data** (padrão: Por pessoa) à esquerda; à direita dois
   `select` (`cc-select`, labels ocultos acessíveis): **Todos os status** (Pago, Pendente, Atrasado) e
   **Todos os tipos** (categorias da família).
2. Linha 2 (chips de membros, `role=group`): **Todos** · um chip por membro (avatar + nome) · **Família**.

## Lista — Por pessoa

Uma seção por membro (todos que existem, mesmo sem despesas) + seção **Família**.

- Cabeçalho `cc-group__head`: avatar + nome (Família: "Família" + caption "dividida entre Jefferson e
  Lorrane"), à direita `cc-group__sum`: "{n} despesas · **R$ subtotal** · pago R$ … · pendente R$ …"
  (se houver atrasadas: "atrasado R$ …").
- Sem despesas: "Nenhuma despesa em {mês}".
- **Desktop:** tabela `cc-table` (min 760px, `cc-tablebox`) com colunas **Descrição · Tipo · Vencimento ·
  Parcela · Lançado por · Valor (direita, `num`) · Status**. Descrição em negrito + caption (observação;
  "Pago por {nome} em 05/11"). Tipo = ponto `chart-*` + nome. Vencimento `dd/mm`. Parcela: "—",
  "Recorrente" ou "7 de 8". Ação **Marcar como paga** (botão ghost sm) na linha.
- **Celular:** `cc-list` com `ExpenseRow` (ícone-ponto, título, meta "vence 10/11 · Cartões" /
  "venceu 03/11 · 7 de 8" / "pago por Jefferson · 05/11", valor, badge); marcar como paga por deslizar.
  Cabeçalho do grupo mostra só o subtotal (Família: "· pago R$ …").

## Lista — Por data

Mesma tabela/lista, sem grupos por pessoa, ordenada por vencimento (atrasadas primeiro), com o dono
indicado por avatar na linha.

## Ações

- Tocar/clicar na linha abre `/despesas/[id]`.
- Marcar como paga registra `pago_em` e `pago_por` (quem clicou). Mês fechado: ações desabilitadas.
