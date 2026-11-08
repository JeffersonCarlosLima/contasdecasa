---
name: deploy-contas-da-casa
description: Como realizar o deploy em produção do Contas da Casa no servidor Oracle (Docker Compose + PostgreSQL compartilhado + Cloudflare Tunnel). Use ao publicar novas versões em produção, realizar rollbacks ou gerenciar o ambiente de testes de QA local.
---

# Deploy do Contas da Casa

Instruções operacionais para publicação em produção da aplicação **Contas da Casa** (`contasdecasa-app`). Para a arquitetura completa e detalhes operacionais aprofundados, consulte [docs/deploy.md](file:///home/jefferson/Documentos/contasdecasa/docs/deploy.md).

## Regras de Ouro (Invioláveis)

1. **Nunca executar seed em produção**: `pnpm db:seed` jamais deve ser executado no banco de produção.
2. **Nunca tocar em outras aplicações**: O servidor hospeda múltiplos projetos. Apenas a stack `contasdecasa` pode ser manipulada.
3. **Nunca usar `pkill -f`**: Finalize processos exclusivamente pelos respectivos PIDs para não afetar outros serviços.
4. **Sem segredos no Git**: Nenhuma chave SSH, IP de servidor ou variável confidencial deve ser persistida no repositório. Use variáveis de ambiente (`DEPLOY_HOST` e `DEPLOY_SSH_KEY`).
5. **Backup sempre antes**: Toda publicação exige um backup via `pg_dump` conferido antes de qualquer alteração de código ou schema.
6. **Deploy exige autorização**: Não realize deploy sem o aval explícito do responsável pelo projeto.

---

## Pré-requisitos Verificáveis

Antes de iniciar qualquer deploy, certifique-se de que os testes e builds locais estão verdes:

```bash
pnpm test && pnpm lint && pnpm typecheck
```

Caso o ambiente de QA local tenha sido utilizado, encerre-o e valide o build de produção localmente:
```bash
pnpm build
```

---

## Procedimento de Deploy Automatizado

O repositório disponibiliza o script [scripts/deploy.sh](file:///home/jefferson/Documentos/contasdecasa/scripts/deploy.sh), que implementa o fluxo oficial de forma segura com `set -euo pipefail`.

### Como Executar:

1. Defina as variáveis no terminal (mantidas fora do versionamento):
   ```bash
   export DEPLOY_HOST="ubuntu@<IP_OU_HOST>"
   export DEPLOY_SSH_KEY="/caminho/para/chave-ssh.key"
   ```
2. Execute o script a partir da raiz do projeto:
   ```bash
   ./scripts/deploy.sh
   ```

O script realiza autonomamente:
- Validação das variáveis e da conectividade SSH.
- Backup remoto via `pg_dump` em `/DATA/Documents/backups/` com conferência de tamanho.
- Transferência atômica da árvore do commit atual (`HEAD`) via `git archive`, preservando `.env` e `compose.override.yaml`.
- Build das imagens Docker `app` e `migrate` no servidor.
- Execução das migrations pendentes (`docker compose run --rm migrate`). Aborta se houver falha sem subir a nova aplicação.
- Subida controlada do container (`docker compose up -d app`).
- Validação do endpoint `/api/health` (local na porta 3052 e público via Cloudflare) e checagem do status `healthy`.

---

## Procedimento Manual Passo a Passo

Caso precise executar manualmente:

1. **Backup**:
   ```bash
   ssh -o StrictHostKeyChecking=no -i "$DEPLOY_SSH_KEY" "$DEPLOY_HOST" \
     "docker exec postgresql pg_dump -U superuser -d contasdecasa > /DATA/Documents/backups/contasdecasa_backup_\$(date +%Y%m%d_%H%M%S).sql"
   ```
2. **Envio do Código**:
   ```bash
   git archive HEAD | ssh -o StrictHostKeyChecking=no -i "$DEPLOY_SSH_KEY" "$DEPLOY_HOST" \
     "tar -x -C /DATA/Documents/projetos/contasdecasa"
   ```
3. **Build**:
   ```bash
   ssh -o StrictHostKeyChecking=no -i "$DEPLOY_SSH_KEY" "$DEPLOY_HOST" \
     "cd /DATA/Documents/projetos/contasdecasa && docker compose build app migrate"
   ```
4. **Migrate**:
   ```bash
   ssh -o StrictHostKeyChecking=no -i "$DEPLOY_SSH_KEY" "$DEPLOY_HOST" \
     "cd /DATA/Documents/projetos/contasdecasa && docker compose run --rm migrate"
   ```
5. **Up**:
   ```bash
   ssh -o StrictHostKeyChecking=no -i "$DEPLOY_SSH_KEY" "$DEPLOY_HOST" \
     "cd /DATA/Documents/projetos/contasdecasa && docker compose up -d app"
   ```
6. **Verificação**:
   - Local: `curl -i -s http://127.0.0.1:3052/api/health` ➔ 200 `{"ok":true}`
   - Público: `curl -i -s https://contasdecasa.rootflow.pro/api/health` ➔ 200 `{"ok":true}`

---

## Rollback em Caso de Falha

- Se o erro ocorrer **antes** do `docker compose up -d app`: mantenha o container anterior no ar.
- Se a aplicação nova apresentar regressão:
  ```bash
  git archive <commit_estavel_anterior> | ssh -o StrictHostKeyChecking=no -i "$DEPLOY_SSH_KEY" "$DEPLOY_HOST" \
    "tar -x -C /DATA/Documents/projetos/contasdecasa"
  ssh -o StrictHostKeyChecking=no -i "$DEPLOY_SSH_KEY" "$DEPLOY_HOST" \
    "cd /DATA/Documents/projetos/contasdecasa && docker compose build app && docker compose up -d app"
  ```
- Se a migration corrompeu dados ou schema incompatível:
  ```bash
  ssh -o StrictHostKeyChecking=no -i "$DEPLOY_SSH_KEY" "$DEPLOY_HOST" \
    "docker exec -i postgresql psql -U superuser -d contasdecasa < /DATA/Documents/backups/<arquivo_backup>.sql"
  ```

---

## Gerenciamento do QA Local

Para testar antes do deploy com banco descartável:

- **Subir QA**:
  1. Postgres temporário em `/tmp/cc-pg-qa-data` na porta `55433`:
     ```bash
     /home/jefferson/bin/initdb -D /tmp/cc-pg-qa-data -U postgres -A trust
     /home/jefferson/bin/pg_ctl -D /tmp/cc-pg-qa-data -o "-p 55433 -k /tmp" -l /tmp/cc-pg-qa.log start
     DATABASE_URL="postgres://postgres@localhost:55433/postgres" pnpm db:migrate
     DATABASE_URL="postgres://postgres@localhost:55433/postgres" BETTER_AUTH_URL="http://localhost:3100" APP_URL="http://localhost:3100" pnpm db:seed
     ```
  2. Next Dev em `http://localhost:3100`:
     ```bash
     rm -rf .next
     setsid env DATABASE_URL="postgres://postgres@localhost:55433/postgres" BETTER_AUTH_URL="http://localhost:3100" APP_URL="http://localhost:3100" PORT=3100 pnpm next dev -p 3100 </dev/null >/tmp/cc-next-qa.log 2>&1 &
     ```
- **Derrubar QA**:
  1. Identificar e matar PIDs de Next Dev e Postgres (porta 3100 e 55433).
  2. Parar Postgres: `/home/jefferson/bin/pg_ctl -D /tmp/cc-pg-qa-data stop`.
  3. Limpar `/tmp/cc-pg-qa-data`, `/tmp/cc-pg-qa.log`, `/tmp/cc-next-qa.log`.
