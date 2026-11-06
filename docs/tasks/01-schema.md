# 01 · Schema e migrations — feito

- [x] Tabelas de auth + 8 tabelas de negócio em `src/db/schema` (ver `docs/specs/01-dados.md`)
- [x] Migration `drizzle/0000_*.sql` aplicada num Postgres 16 limpo sem erros
- [ ] Revisar com o Jefferson (campos extras: `family_invites.participates_in_split`,
      `member_incomes.family_id`, enum `kinship` com `conjuge` sem acento no banco)
- [ ] Índice único parcial para evitar dois convites pendentes para o mesmo email na mesma família
