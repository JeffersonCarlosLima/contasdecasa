# 06 · Despesas

Telas: `docs/interfaces/04-despesas.md`, `05-lancar-despesa.md`

- [ ] `/despesas/nova` e `/despesas/[id]` conforme o protótipo (chips de dono, Família, parcelado, recorrente)
- [ ] Parcelado: gerar parcelas futuras no mesmo grupo (`futureInstallments`); "só esta / esta e as próximas" ao editar e excluir
- [ ] Recorrente: criar modelo em `recurring_expenses`; copiar para o mês
- [ ] `/despesas`: por pessoa (com subtotais) e por data; filtros membro/categoria/status; tabela no desktop, lista no celular
- [ ] Marcar como paga (registra `paid_at` e `paid_by`); desfazer
- [ ] Exclusão lógica (`deleted_at`); permissões (membro: próprias e da Família; admin/dono: todas)
- [ ] "Atrasado" calculado (`lib/dates`), fuso America/Araguaina
