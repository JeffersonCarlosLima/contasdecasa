# CategoryChip

Chip de categoria com ponto colorido, usado para filtrar a lista e escolher a categoria ao lançar.

**Recebe:** nome da categoria, cor (`chart-1` a `chart-6`, definida no cadastro de tipos de despesa), estado selecionado (`aria-pressed`).

**Classes:** `cc-chip` > `cc-chip__dot` (fundo `var(--chart-N)`) + nome.

- A cor da categoria é a mesma em chips, linhas e gráficos.
- Mais de seis categorias: as de menor gasto se agrupam em "Outras" (`chart-6`) nos gráficos; nos chips todas aparecem.
- Selecionado usa `brand-soft` com borda `brand`, nunca a cor da categoria.
