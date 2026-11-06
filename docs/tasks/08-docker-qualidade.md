# 08 · Docker, README e acabamento

- [x] `Dockerfile` multi-stage (deps → build → runner standalone; alvo `migrate`)
- [x] `compose.yaml` só do app (porta 3000) + serviço `migrate` (perfil `tools`)
- [x] `.env.example`, `README.md`
- [ ] Validar `docker compose build` e subir contra o Postgres do servidor (não testado no ambiente de criação)
- [ ] Healthcheck (`/api/health`) e variáveis de produção
- [ ] `/conta` (layout a aprovar); tema escuro com troca manual
- [ ] Passada de acessibilidade (foco, contraste, `aria`) nas telas
