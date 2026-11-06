# SplitCard

Card que mostra quanto cada membro do lar paga das despesas do mês, pela regra de divisão do lar.

**Recebe:** os dois membros (nome, inicial, renda), total de despesas, regra (`igual` ou `proporcional à renda`) e o valor calculado de cada um.

**Classes:** `cc-card` > `title`, linha `caption` com a regra, `cc-split` > dois `cc-split__person` (`__name` com `cc-avatar`, `__value`, `caption`), `cc-split__bar` com dois segmentos `person-a` / `person-b`.

- Sempre diga a regra em texto: "Divisão proporcional à renda (49% / 51%)".
- Mostre também o que cada um já pagou, para saber quem deve a quem.
- Cores de pessoa sempre com nome ou inicial ao lado.
