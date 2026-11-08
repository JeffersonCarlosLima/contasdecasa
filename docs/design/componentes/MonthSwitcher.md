# MonthSwitcher

Navegação entre meses, no topo de toda tela de dados.

**Recebe:** mês atual (ano + mês), callbacks de anterior e próximo, se o mês está fechado.

**Classes:** `cc-month` > `cc-month__btn` (anterior), `cc-month__label`, `cc-month__btn` (próximo), `cc-month__closed` opcional.

- Rótulo por extenso: "Novembro 2026". Os botões têm `aria-label` "Mês anterior" e "Próximo mês".
- Mês fechado mostra "Fechado" ao lado e bloqueia edição de salários e investimento.
- Tocar no rótulo abre um seletor de mês e ano (`shadow-pop`).
- **Comportamento mobile:** No celular (`@media (max-width: 760px), (max-height: 500px) and (orientation: landscape) and (pointer: coarse)`), os botões `cc-month__btn` medem 40x40px (`width: 40px; height: 40px; min-width: 40px; min-height: 40px`) para assegurar alvo mínimo de toque.
