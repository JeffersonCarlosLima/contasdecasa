# 05 · Lançar despesa — `/despesas/nova` e `/despesas/[id]`

Protótipo: `docs/design/telas/NovaDespesa.dc.html`. `cc-wrap` com largura máx. **880px**. No celular:
cabeçalho com botão "Voltar" (→ `/despesas`), título "Lançar despesa"; sem barra inferior.
Edição (`/despesas/[id]`): mesmo formulário, título "Editar despesa", botão primário "Salvar despesa".

## Desktop: cabeçalho

Link "← Despesas" (`label`) e `heading` **"Lançar despesa"**.

## Formulário (`cc-card`, gap 20px) — ordem

1. Grade `cc-form`:
   - **Descrição** (largura total; texto).
   - **Valor** (`MoneyInput` com prefixo R$, `inputmode=decimal`; hint **"Valor de cada parcela."**).
   - **Vencimento** (`type=date`).
2. Fieldset **Tipo de despesa**: chips de categoria (ponto `chart-*` + nome, um selecionado) + chip-link
   **"+ Novo tipo"** (→ `/tipos`).
3. Grade `cc-form`:
   - **De quem é a despesa** (largura total, chips com avatar): um por membro (o usuário vê "(você)") +
     **"Família (dividir)"**. Hint: **"Família" divide a despesa entre {participantes}, {regra}. Lançado por {usuário}.**
   - **Forma de pagamento** (`select`: lê apenas as **formas ativas** cadastradas da família, ex.: Nubank, Bradesco, Inter…; formas arquivadas não aparecem para novos lançamentos). Ao selecionar um cartão com dias de fechamento e vencimento configurados, o formulário sugere automaticamente o mês de referência e a data de vencimento a partir da data atual (regra de fatura); o usuário pode alterar livremente. Cartão sem dias configurados mantém o comportamento padrão.
   - **Status** — segmentado **Pendente | Pago**.
   - **Quem pagou (quando pago)** — `select` de membros (desabilitado enquanto Pendente).
4. Bloco `surface-sunken` (padding 16, gap 12):
   - Checkbox **"Compra parcelada"** → campos **Parcela atual** e **Total de parcelas** (numéricos).
   - Caption dinâmica: "Gera a parcela 8 de 8 em dezembro 2026 automaticamente. Comprometido nos
     próximos meses: R$ 1.088,00."
   - Checkbox **"Repetir todo mês (despesa recorrente)"**.
5. **Observação (opcional)** — `placeholder="Ex.: inclui seguro"`, largura total.
6. Rodapé (`cc-formfoot`, à direita; no celular botões em linha cheia): **Cancelar** (secundário) ·
   **Salvar e lançar outra** (secundário, oculto no celular) · **Lançar despesa** (primário).

## Regras

- Valor é o de **cada parcela** (decidido pelo design).
- Parcelado gera as parcelas futuras no mesmo grupo; editar/excluir pergunta "Só esta" ou "Esta e as próximas".
- Erro de valor: "Informe um valor maior que zero."
- Membro comum só edita as próprias e as da Família; admin/dono editam todas.
- **Formas de pagamento e sugestão de fatura**: apenas formas ativas são listadas no formulário. Se a forma escolhida for um cartão com dia de fechamento e dia de vencimento, o sistema sugere o mês e o vencimento da despesa aplicando a regra da fatura a partir da data de hoje: compra com dia ≤ fechamento entra na fatura que fecha no mesmo mês, dia > fechamento na do mês seguinte; vencimento no mesmo mês do fechamento se vencimento > fechamento, senão no mês seguinte; dia inexistente ajustado ao último dia do mês; o mês da despesa (`reference_month`) é o mês do vencimento (ver detalhes e exemplos em `docs/specs/02-regras-calculo.md`). No formulário isso é apenas uma sugestão inicial e o usuário tem total liberdade para manter ou alterar os valores sugeridos. Cartão sem dias configurados mantém o comportamento padrão.
