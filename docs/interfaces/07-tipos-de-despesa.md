# 07 · Tipos e formas — `/tipos`

Protótipo base: `docs/design/telas/Categorias.dc.html`.

- Menu lateral: item **"Tipos e formas"** (→ `/tipos`).
- Título da página: `heading` **"Tipos e formas"** (oculto no celular) e apoio: "Os tipos agrupam as despesas no dashboard. A cor é a mesma em todos os gráficos."

---

## Seção 1: Tipos de despesa

- A seção de tipos mantém o nome **"Tipos de despesa"**.
- Duas colunas (lista `flex 999 1 520px`, formulário `flex 1 1 320px`):
  - **Lista** (`cc-list`, `aria-label="Tipos cadastrados"`): `cc-expense` por tipo — ícone-ponto `chart-*`,
    nome, meta "Fixa · aluguel, lote" / "Variável · mercado, comida" (natureza + exemplos), botão ghost sm
    **"Editar"**. Padrão: Moradia (chart-1, Fixa), Alimentação (chart-2, Variável), Transporte (chart-3,
    Variável), Cartões (chart-4, Variável), Contas da casa (chart-5, Fixa), Saúde e academia (chart-6, Fixa).
  - **Card "Novo tipo"** (`title`): **Nome** (`placeholder="Ex.: Educação"`); **Cor** — 6 chips só com ponto
    14px (`aria-label`: Telha, Folha, Azul, Mostarda, Ameixa, Ardósia); **Natureza** — segmentado
    **Fixa | Variável** (hint "Fixas aparecem como sugestão de recorrente todo mês."); **Limite mensal
    (opcional)** (R$, `placeholder="0,00"`, hint "Avisa no dashboard quando passar."); botão primário
    **"Salvar tipo"**. Em edição o título vira "Editar tipo" e há botão **Arquivar**.

---

## Seção 2: Formas de pagamento (`#formas`)

Fica na mesma rota, logo abaixo da seção de tipos de despesa, usando a âncora `id="formas"`. Segue exatamente o padrão visual de duas colunas (lista + card).

- **Permissões**: Membro comum só lê; apenas admin e dono podem criar, editar, arquivar e reativar.
- **Duas colunas** (lista `flex 999 1 520px`, formulário `flex 1 1 320px`):
  - **Lista** (`cc-list`, `aria-label="Formas cadastradas"`):
    - Itens `cc-expense` por forma de pagamento:
      - **Ícone Lucide por tipo**:
        - Cartão: `credit-card`
        - Conta: `landmark` (banco)
        - Pix: `qr-code`
        - Dinheiro: `banknote` (notas)
      - **Nome** da forma de pagamento.
      - **Meta**: `"Cartão · Jefferson"` / `"Conta · Família"` (sem dono = Família; quando o cartão tiver final preenchido, exibe `"•••• 1234"`, por ex.: `"Cartão •••• 1234 · Jefferson"`).
      - Botão ghost sm **"Editar"** (apenas para admin/dono).
    - **Formas arquivadas**: aparecem agrupadas ou em estado visual distinto ao final da lista, com botão ghost sm **"Reativar"** (apenas para admin/dono).
    - **Estado vazio** (quando não há formas cadastradas):
      `"Cadastre o cartão ou a conta que aparece no seu extrato para poder importar e lançar despesas."`
  - **Card de formulário** (`title`):
    - Título: **"Nova forma de pagamento"** (ao criar) ou **"Editar forma de pagamento"** (ao editar).
    - **Nome** (`placeholder="Ex.: Nubank"`).
    - **Tipo**: `SegmentedControl` da casa com opções **Cartão | Conta | Pix | Dinheiro**.
    - **Dono**: `select` com opção `"Família"` (padrão / sem dono específico) + nomes dos membros ativos da família.
    - **Campos adicionais de Cartão** (exibidos condicionalmente apenas quando o tipo selecionado for **Cartão**):
      - **Final do cartão**: numérico, 4 dígitos (`placeholder="Ex.: 1234"`, opcional).
      - **Dia de fechamento**: numérico, 1–31 (opcional).
      - **Dia de vencimento**: numérico, 1–31 (opcional).
      - *Validação*: dia de fechamento e dia de vencimento são vinculados (devem ser preenchidos ambos ou nenhum).
    - **Ações**:
      - Botão primário **"Salvar forma"**.
      - Em edição: botão secundário/ghost **"Arquivar"** (troca exclusão física por arquivamento lógico via `setPaymentMethodArchived`, preservando integridade das despesas já lançadas e importadas).
- **Celular**: formulário posicionado abaixo da lista, largura cheia. Alvos de toque ≥ 40px, foco visível com anel de 2px `--focus`, cores estritamente por tokens CSS `var(--…)`, apenas um botão primário na seção.
