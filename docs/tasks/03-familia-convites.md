# 03 · Família e convites

Telas: `docs/interfaces/02-criar-familia.md`, `08-familia.md`, `09-telas-sem-prototipo.md` (convite)

- [ ] `/criar-familia`: cria família + membro dono + categorias padrão (transação)
- [ ] `/familia`: lista de membros e convites, papéis, tabela "O que cada papel pode fazer"
- [ ] Convidar por email: token aleatório, só o hash no banco, expira em 7 dias, link para copiar sem SMTP
- [ ] `src/lib/mail.ts` com SMTP opcional (`SMTP_*`)
- [ ] Reenviar / cancelar convite; rate limit no convite
- [ ] `/convite/[token]`: aceitar convite (layout a aprovar)
- [ ] Adicionar dependente sem login; editar membro (papel, cor, parentesco, divisão, percentual)
- [ ] Remover membro (status `removido`, despesas ficam como de ex-membro); transferir posse/excluir família (só dono)
- [ ] Validação Zod em todas as actions; permissões por papel
