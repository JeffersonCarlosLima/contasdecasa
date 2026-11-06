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
   - **Forma de pagamento** (`select`: Boleto / Pix, Nubank, Bradesco, Inter, C6 … das formas cadastradas).
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
