# StatusBadge

Selo do status de pagamento de uma despesa: Pago, Pendente ou Atrasado, sempre com ícone e palavra.

**Recebe:** `status` (`paid | pending | late`). O texto é fixo por status.

**Classes:** `cc-badge` + `cc-badge--paid | --pending | --late`, com um SVG Lucide de 14px (check, clock, alert-circle).

- Atrasado é calculado: pendente com vencimento antes de hoje. Ninguém escolhe "Atrasado" à mão.
- Não use as cores de status para outra coisa (categorias, pessoas).
- Na lista, o selo fica abaixo do valor; em tabela, em coluna própria.
