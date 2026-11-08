# Guia de Deploy e Operações — Contas da Casa

Este documento descreve a arquitetura de produção, o checklist pré-deploy, o procedimento operacional padrão passo a passo, estratégias de rollback, regras de segurança e o gerenciamento do ambiente de QA local.

---

## 1. Arquitetura de Produção

A infraestrutura de produção do **Contas da Casa** está hospedada em um servidor dedicado Oracle Linux / Ubuntu:

- **Acesso ao Servidor**:
  - Usuário Linux de serviço: `ubuntu`.
  - Acesso remoto exclusivo via chave SSH privada.
  - As credenciais de conexão (endereço de host/IP e chave privada) **não** residem no repositório; são fornecidas via variáveis de ambiente (`DEPLOY_HOST` e `DEPLOY_SSH_KEY`).
- **Aplicação (`contasdecasa-app`)**:
  - Imagem Docker multi-stage (`node:22-alpine`) executando a compilação standalone do Next.js 15.
  - Gerenciada via Docker Compose a partir do diretório `/DATA/Documents/projetos/contasdecasa`.
  - Expõe internamente a porta `127.0.0.1:3052:3000` (configurada via `APP_PORT=3052` no arquivo `.env` remoto).
  - Possui healthcheck embutido que consulta `http://127.0.0.1:3000/api/health`.
- **Banco de Dados PostgreSQL**:
  - Instância PostgreSQL 17 executando no container compartilhado do host chamado `postgresql`.
  - O app e o serviço de migration comunicam-se com o banco através da rede Docker externa `postgresql_default`.
  - Esta conexão de rede é habilitada exclusivamente pelo arquivo `compose.override.yaml`, que existe apenas no servidor de produção (não versionado no Git).
- **Roteamento e Acesso Público**:
  - Um **Cloudflare Tunnel** (cloudflared) rodando no servidor faz o proxy seguro da porta local `127.0.0.1:3052` para o domínio público:
    `https://contasdecasa.rootflow.pro`
  - Nenhuma porta web da aplicação fica exposta diretamente para a internet aberta (apenas localhost).

---

## 2. Pré-requisitos para Deploy

Nenhum deploy em produção deve ser iniciado sem que os seguintes critérios tenham sido atendidos:

1. **Testes e Validações Locais**:
   ```bash
   pnpm test
   pnpm lint
   pnpm typecheck
   ```
   Todos os 3 comandos devem retornar código de saída `0` sem erros ou pendências.
2. **Revisão Cruzada Aprovada**:
   - O código deve ter passado por revisão de código entre os pares/agentes.
3. **Validação Visual e Funcional no QA**:
   - Os fluxos modificados devem ter sido exercitados e validados no ambiente de QA local (`http://localhost:3100`), simulando mobile (375px/390px) e desktop (1120px) em temas claro e escuro.
4. **Validação do Build de Produção**:
   - O comando `pnpm build` deve ser executado e validado localmente com o ambiente de QA parado (para evitar colisão ou corrupção de chunks em `.next`).
5. **Autorização Explícita**:
   - Deploy em produção requer confirmação explícita do responsável pelo projeto.

---

## 3. Passo a Passo do Deploy em Produção

O procedimento abaixo reflete o processo oficial executado no servidor.

### Variáveis Locais de Ambiente (fora do Git)
Configure no seu terminal local antes de iniciar:
```bash
export DEPLOY_HOST="ubuntu@<IP_OU_HOST_DO_SERVIDOR>"
export DEPLOY_SSH_KEY="/caminho/para/chave-ssh.key"
export DEPLOY_DIR="/DATA/Documents/projetos/contasdecasa"
export BACKUP_DIR="/DATA/Documents/backups"
```

### Passo 1: Backup Completo do Banco de Dados
Sempre execute o backup antes de qualquer modificação de código ou migration:
```bash
SSH_CMD="ssh -o StrictHostKeyChecking=no -i $DEPLOY_SSH_KEY $DEPLOY_HOST"
DATA_HORA=$($SSH_CMD "date +%Y%m%d_%H%M%S")
BACKUP_ARQUIVO="$BACKUP_DIR/contasdecasa_backup_${DATA_HORA}.sql"

# Executa o dump do banco de dados de produção
$SSH_CMD "docker exec postgresql pg_dump -U superuser -d contasdecasa > $BACKUP_ARQUIVO"

# Confere se o arquivo foi criado e não está vazio
$SSH_CMD "ls -lh $BACKUP_ARQUIVO"
$SSH_CMD "tail -n 5 $BACKUP_ARQUIVO"
```
> [!IMPORTANT]
> Se o arquivo de backup estiver vazio ou não contiver `-- PostgreSQL database dump complete --`, **ABORTAR IMEDIATAMENTE**.

### Passo 2: Envio do Código via Git Archive
O código do commit aprovado (`HEAD`) é empacotado e transferido sem incluir arquivos git ou arquivos locais de desenvolvimento. Os arquivos `.env` e `compose.override.yaml` presentes no servidor **são preservados intactos**:
```bash
git archive HEAD | $SSH_CMD "tar -x -C $DEPLOY_DIR"

# Verifique se os arquivos de configuração do servidor continuam no local
$SSH_CMD "ls -la $DEPLOY_DIR/.env $DEPLOY_DIR/compose.override.yaml"
```

### Passo 3: Build das Imagens Docker
Reconstrua as imagens no servidor para garantir paridade total com o ambiente do host:
```bash
$SSH_CMD "cd $DEPLOY_DIR && docker compose build app migrate"
```

### Passo 4: Execução das Migrations
Execute o runner descartável de migrations:
```bash
$SSH_CMD "cd $DEPLOY_DIR && docker compose run --rm migrate"
```
> [!CAUTION]
> Se a migration falhar: **NÃO suba a aplicação nova**. Mantenha o container atual rodando e investigue os logs. Veja a seção de Rollback.

### Passo 5: Inicialização da Nova Aplicação
Recrie e suba o container com a imagem recém-construída:
```bash
$SSH_CMD "cd $DEPLOY_DIR && docker compose up -d app"
```

### Passo 6: Verificação de Saúde (Healthchecks)
Valide o retorno do endpoint de saúde localmente na porta do servidor e publicamente pelo domínio:
```bash
# 1. Healthcheck interno no host
$SSH_CMD "curl -i -s http://127.0.0.1:3052/api/health"

# 2. Healthcheck público via Cloudflare
curl -i -s https://contasdecasa.rootflow.pro/api/health

# 3. Status do container
$SSH_CMD "docker ps --filter name=contasdecasa"
```
Ambos os endpoints devem retornar **HTTP 200** com `{"ok":true}`, e o container deve reportar status `Up ... (healthy)`.

---

## 4. Procedimento de Rollback

Se algo falhar após ou durante o deploy:

### Cenário A: Falha na migration ou no build antes do `up -d`
- O container anterior continua em execução sem interrupção.
- Nenhuma ação de restauração de banco é necessária caso a migration não tenha sido aplicada.

### Cenário B: Falha na aplicação após o deploy (sem alteração destrutiva no banco)
1. Identifique o hash do commit estável anterior (`<commit-anterior>`).
2. Transfira o código estável:
   ```bash
   git archive <commit-anterior> | $SSH_CMD "tar -x -C $DEPLOY_DIR"
   ```
3. Reconstrua e suba:
   ```bash
   $SSH_CMD "cd $DEPLOY_DIR && docker compose build app && docker compose up -d app"
   ```

### Cenário C: A migration alterou dados ou esquema e precisa ser revertida
1. Restaure o dump gerado no Passo 1:
   ```bash
   $SSH_CMD "docker exec -i postgresql psql -U superuser -d contasdecasa < $BACKUP_ARQUIVO"
   ```
2. Aplique o rollback do código para o commit anterior conforme Cenário B.
3. Valide o healthcheck e a consistência dos dados.

---

## 5. Proibições Estritas em Produção

- **NUNCA rodar seed em produção**: O comando `pnpm db:seed` popula usuários e despesas de teste e sobrescreve dados de faturas/rendas.
- **NUNCA tocar em outras aplicações/containers**: O servidor Oracle é multi-tenant e roda outros serviços de produção (ex: `menupro-app`, `barbeariapro-app-1`, `waha`, `evolution-go`, etc.). Opere exclusivamente com filtros `name=contasdecasa`.
- **NUNCA usar `pkill -f`**: Comandos genéricos matam processos de outros serviços do servidor ou de outros agentes. Mate processos apenas por PID individual.
- **NUNCA commitar segredos no Git**: Chaves SSH, IPs, tokens e arquivos `.env` jamais devem ser comitados.

---

## 6. Ambiente de QA Local

O ambiente de QA local serve para validações pontuais e testes com banco isolado e dados de desenvolvimento.

### Subir o QA Local

1. **Inicializar o cluster PostgreSQL temporário na porta 55433**:
   ```bash
   rm -rf /tmp/cc-pg-qa-data /tmp/cc-pg-qa.log
   /home/jefferson/bin/initdb -D /tmp/cc-pg-qa-data -U postgres -A trust
   /home/jefferson/bin/pg_ctl -D /tmp/cc-pg-qa-data -o "-p 55433 -k /tmp" -l /tmp/cc-pg-qa.log start
   ```

2. **Aplicar Migrations e Seed no QA**:
   ```bash
   DATABASE_URL="postgres://postgres@localhost:55433/postgres" pnpm db:migrate
   DATABASE_URL="postgres://postgres@localhost:55433/postgres" BETTER_AUTH_URL="http://localhost:3100" APP_URL="http://localhost:3100" pnpm db:seed
   ```

3. **Iniciar o Next Dev na porta 3100**:
   ```bash
   # Limpar cache do build para evitar colisão de chunks
   rm -rf .next

   # Iniciar servidor em background com variáveis explícitas
   setsid env DATABASE_URL="postgres://postgres@localhost:55433/postgres" \
              BETTER_AUTH_URL="http://localhost:3100" \
              APP_URL="http://localhost:3100" \
              PORT=3100 \
              pnpm next dev -p 3100 </dev/null >/tmp/cc-next-qa.log 2>&1 &
   ```

4. **Credenciais do Seed de QA**:
   - Dono: `jefferson@exemplo.com` / `senha-dev-contas`
   - Admin: `lorrane@exemplo.com` / `senha-dev-contas`
   - URL: `http://localhost:3100`

### Derrubar o QA Local

1. **Descobrir os PIDs em execução**:
   ```bash
   ps -ef | grep -E "postgres.*55433|next.*3100" | grep -v grep
   ```
2. **Encerrar os processos por PID**:
   ```bash
   kill <PID_NEXT_DEV>
   /home/jefferson/bin/pg_ctl -D /tmp/cc-pg-qa-data stop
   ```
3. **Limpar arquivos temporários**:
   ```bash
   rm -rf /tmp/cc-pg-qa-data /tmp/cc-pg-qa.log /tmp/cc-next-qa.log
   ```
