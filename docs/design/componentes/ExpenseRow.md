# ExpenseRow

Linha de despesa na lista do mês: categoria, descrição, dono, vencimento, parcela, valor e status.

**Recebe:** descrição, categoria (nome + cor `chart-*`), dono (membro do lar → avatar `cc-avatar--a | --b` com inicial), vencimento, parcela atual e total (opcional), observação (opcional), valor em centavos, status.

**Classes:** `cc-list` > `cc-expense` > `cc-expense__icon` (ponto da categoria), `cc-expense__main` (`__title`, `__meta`), `cc-expense__side` (`__value` + `StatusBadge`), `cc-expense__action` (opcional, ação da linha; no celular desce para uma linha própria abaixo do texto).

- Tocar na linha abre a edição; marcar como paga é ação de deslizar no celular ou botão `--ghost` no desktop.
- Metadado na ordem: avatar e nome do dono · vencimento · parcela · observação. Ex.: "J Jefferson · vence 10/11 · parcela 3 de 8".
- Valor em `ink`, nunca em vermelho; o status já diz se está atrasado.
- Ordene por vencimento; atrasadas primeiro.
