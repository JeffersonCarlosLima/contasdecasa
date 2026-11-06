# 02 · Autenticação

Spec: `docs/specs/03-auth-permissoes.md` · Telas: `docs/interfaces/01-entrar.md`

- [ ] `src/lib/auth.ts` (Better Auth + adapter Drizzle, email/senha, cookie de sessão, rate limit)
- [ ] `src/lib/auth-client.ts` e rota `/api/auth/[...all]`
- [ ] `src/lib/session.ts`: `requireSession()`, `requireMember()`, `requireRole()`; família e papel só pela sessão
- [ ] `/entrar` e `/cadastro` idênticas ao protótipo (painel telha, segmentado, "Manter conectado")
- [ ] Redirecionamentos: sem sessão → `/entrar`; sem família → `/criar-familia`; convite pendente → entra na família
- [ ] "Esqueci a senha" visível, leva a aviso "Em breve" (recuperação fora do MVP)
- [ ] Testes: acesso negado sem sessão e entre famílias
