# 07 · Tipos de despesa — `/tipos`

Protótipo: `docs/design/telas/Categorias.dc.html`.

- Título `heading` **"Tipos de despesa"** (oculto no celular) e apoio: "Os tipos agrupam as despesas no
  dashboard. A cor é a mesma em todos os gráficos."
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
- **Formas de pagamento** (CRUD por família: nome, tipo cartão/conta/pix/dinheiro, dono opcional) ficam
  na mesma rota, em seção abaixo com o mesmo padrão lista + card (título `title` "Formas de pagamento").
  *(Sem protótipo próprio: usar exatamente o padrão visual de "Tipos de despesa".)*
- Celular: formulário abaixo da lista, largura cheia.
