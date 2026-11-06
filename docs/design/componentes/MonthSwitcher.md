# MonthSwitcher

Navegação entre meses, no topo de toda tela de dados.

**Recebe:** mês atual (ano + mês), callbacks de anterior e próximo, se o mês está fechado.

**Classes:** `cc-month` > `cc-month__btn` (anterior), `cc-month__label`, `cc-month__btn` (próximo), `cc-month__closed` opcional.

- Rótulo por extenso: "Novembro 2026". Os botões têm `aria-label` "Mês anterior" e "Próximo mês".
- Mês fechado mostra "Fechado" ao lado e bloqueia edição de salários e investimento.
- Tocar no rótulo abre um seletor de mês e ano (`shadow-pop`).
