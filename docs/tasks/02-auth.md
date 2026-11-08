# 02 · Autenticação

Spec: `docs/specs/03-auth-permissoes.md` · Telas: `docs/interfaces/01-entrar.md`

- [x] `src/lib/auth.ts` (Better Auth + adapter Drizzle, email/senha, cookie de sessão, rate limit)
- [x] `src/lib/auth-client.ts` e rota `/api/auth/[...all]`
- [x] `src/lib/session.ts`: `requireSession()`, `requireMember()`, `requireRole()`; família e papel só pela sessão
- [x] `/entrar` e `/cadastro` idênticas ao protótipo (painel telha, segmentado, "Manter conectado")
- [~] Redirecionamentos: sem sessão → `/entrar`; sem família → `/criar-familia` (feito); convite pendente → entra na família (vai com a etapa 03)
- [x] "Esqueci a senha" visível, leva a aviso "Em breve" (recuperação fora do MVP)
- [x] Testes: acesso negado sem sessão e entre famílias

Pendências: login de ponta a ponta sem testar (banco inacessível); textos do modo "Criar conta" (apoio, rodapé e erro) aguardam o Jefferson.
