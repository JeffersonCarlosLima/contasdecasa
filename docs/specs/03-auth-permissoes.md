# 03 · Autenticação, permissões e segurança

- Better Auth, email + senha, sessão por cookie. Recuperação de senha **fora do MVP**.
- Toda Server Action e rota valida a sessão, **resolve membro e família pela sessão** (nunca pelo cliente)
  e checa o papel. Helper único: `src/lib/session.ts` (`requireMember()`, `requireRole('admin')`).
- Papéis:
  - `membro`: lança e edita as próprias despesas e as da Família; vê tudo da família.
  - `admin`/`dono`: também edita despesas dos outros, membros, fechamento e cadastros.
  - Só o `dono` exclui a família ou transfere a posse.
- Convite: token aleatório, guardado **só como hash**; expira em 7 dias; link `/convite/[token]`.
  Sem `SMTP_*`, a UI mostra o link para copiar.
- Senha com o hash padrão do Better Auth. Rate limit no login e no convite.
- Toda entrada validada com Zod (schemas em `src/lib/validators`). Nunca confiar em `family_id` vindo do cliente.
- Mês fechado: somente leitura (dono/admin podem reabrir).
