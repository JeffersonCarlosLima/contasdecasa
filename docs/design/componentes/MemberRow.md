# MemberRow

Linha de membro da família: avatar, nome, papel, parentesco, participação na divisão e ação.

**Recebe:** nome, inicial e cor (`cc-avatar--a | --b | --c | --d`), papel (Dono, Admin, Membro), parentesco, se participa da divisão e com que parte, status (ativo, convidado, dependente sem login), ação (Editar, Reenviar convite).

**Classes:** `cc-list` > `cc-member` > `cc-avatar`, `cc-member__main` (`__name` com `cc-role` / `cc-role--owner` / `cc-role--invited`, `__meta`), botão `cc-btn--ghost cc-btn--sm`.

- Convites pendentes aparecem na mesma lista, com `cc-role--invited` e o email no lugar do nome.
- Dependente sem login diz isso no metadado: "Sem login · despesas lançadas pelos pais".
- Só dono e admin veem as ações de editar e remover.

Também em `bundle.css`: `cc-avatars` (avatares sobrepostos) e `cc-group__head` (cabeçalho de seção por pessoa nas listas de despesas, com subtotal).
