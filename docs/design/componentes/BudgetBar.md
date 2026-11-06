# BudgetBar

Barra única que mostra para onde vai a renda do mês: investido, pago, pendente e o que sobra livre.

**Recebe:** renda total, investido, pago e pendente em centavos. O trecho livre é o resto da renda; se o resto for negativo, a barra fica cheia e a legenda mostra o excesso em `danger`.

**Classes:** `cc-card cc-budget` > `title`, `cc-budget__track` com segmentos `cc-budget__seg--invest | --paid | --pending` (largura em % da renda), `cc-budget__legend` com `cc-budget__key`.

- Sempre com legenda em texto e valores; a cor sozinha não basta.
- O trecho livre é o próprio trilho (`surface-sunken`), sem cor.
- Fica logo abaixo dos KPIs.
