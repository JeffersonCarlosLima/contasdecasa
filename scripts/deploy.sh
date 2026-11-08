#!/usr/bin/env bash
# ==============================================================================
# Script de Deploy em Produção — Contas da Casa
#
# Uso:
#   export DEPLOY_HOST="ubuntu@<host-ou-ip>"
#   export DEPLOY_SSH_KEY="/caminho/para/chave.key"
#   ./scripts/deploy.sh
#
# Variáveis opcionais:
#   DEPLOY_REMOTE_DIR (padrão: /DATA/Documents/projetos/contasdecasa)
#   DEPLOY_BACKUP_DIR (padrão: /DATA/Documents/backups)
#   DEPLOY_APP_PORT   (padrão: 3052)
#   PUBLIC_HEALTH_URL (padrão: https://contasdecasa.rootflow.pro/api/health)
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Validações Iniciais
# ------------------------------------------------------------------------------

if [[ -z "${DEPLOY_HOST:-}" ]]; then
  echo "ERRO: A variável DEPLOY_HOST não está definida." >&2
  echo "Exemplo: export DEPLOY_HOST=\"ubuntu@1.2.3.4\"" >&2
  exit 1
fi

if [[ -z "${DEPLOY_SSH_KEY:-}" ]]; then
  echo "ERRO: A variável DEPLOY_SSH_KEY não está definida." >&2
  echo "Exemplo: export DEPLOY_SSH_KEY=\"/caminho/para/chave-ssh.key\"" >&2
  exit 1
fi

if [[ ! -f "$DEPLOY_SSH_KEY" ]]; then
  echo "ERRO: Arquivo de chave SSH não encontrado em '$DEPLOY_SSH_KEY'." >&2
  exit 1
fi

DEPLOY_REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/DATA/Documents/projetos/contasdecasa}"
DEPLOY_BACKUP_DIR="${DEPLOY_BACKUP_DIR:-/DATA/Documents/backups}"
DEPLOY_APP_PORT="${DEPLOY_APP_PORT:-3052}"
PUBLIC_HEALTH_URL="${PUBLIC_HEALTH_URL:-https://contasdecasa.rootflow.pro/api/health}"

CURRENT_COMMIT="$(git rev-parse --short HEAD)"
echo "==> Iniciando deploy do commit $CURRENT_COMMIT em $DEPLOY_HOST"

SSH_OPTS=(-o "StrictHostKeyChecking=no" -o "UserKnownHostsFile=/dev/null" -o "LogLevel=ERROR" -i "$DEPLOY_SSH_KEY")
SSH_CMD=(ssh "${SSH_OPTS[@]}" "$DEPLOY_HOST")

# Testa conectividade SSH
echo "==> Testando conexão SSH com o servidor..."
"${SSH_CMD[@]}" "echo 'Conexão SSH estabelecida com sucesso.'"

# ------------------------------------------------------------------------------
# 2. Backup do Banco de Dados
# ------------------------------------------------------------------------------

TIMESTAMP="$("${SSH_CMD[@]}" 'date +%Y%m%d_%H%M%S')"
BACKUP_FILE="${DEPLOY_BACKUP_DIR}/contasdecasa_backup_${TIMESTAMP}.sql"

echo "==> [Passo 1/5] Gerando backup do banco de dados em $BACKUP_FILE..."
"${SSH_CMD[@]}" "mkdir -p '$DEPLOY_BACKUP_DIR' && docker exec postgresql pg_dump -U superuser -d contasdecasa > '$BACKUP_FILE'"

# Verifica se o arquivo foi criado e possui conteúdo válido
echo "==> Verificando integridade do backup..."
"${SSH_CMD[@]}" "
  if [ ! -s '$BACKUP_FILE' ]; then
    echo 'ERRO: Arquivo de backup está vazio ou inexistente!' >&2
    exit 1
  fi
  if ! tail -n 10 '$BACKUP_FILE' | grep -q 'PostgreSQL database dump complete'; then
    echo 'ERRO: O dump do banco não foi finalizado corretamente!' >&2
    exit 1
  fi
  ls -lh '$BACKUP_FILE'
"
echo "==> Backup concluído com sucesso."

# ------------------------------------------------------------------------------
# 3. Transferência do Código (git archive)
# ------------------------------------------------------------------------------

echo "==> [Passo 2/5] Transferindo código do commit $CURRENT_COMMIT..."
git archive HEAD | "${SSH_CMD[@]}" "tar -x -C '$DEPLOY_REMOTE_DIR'"

# Confere se os arquivos protegidos continuam existindo
"${SSH_CMD[@]}" "
  if [ ! -f '$DEPLOY_REMOTE_DIR/.env' ]; then
    echo 'ERRO: O arquivo .env remoto desapareceu!' >&2
    exit 1
  fi
  if [ ! -f '$DEPLOY_REMOTE_DIR/compose.override.yaml' ]; then
    echo 'ERRO: O arquivo compose.override.yaml remoto desapareceu!' >&2
    exit 1
  fi
"
echo "==> Código transferido e arquivos de configuração preservados."

# ------------------------------------------------------------------------------
# 4. Build das Imagens Docker
# ------------------------------------------------------------------------------

echo "==> [Passo 3/5] Construindo imagens Docker (app e migrate)..."
"${SSH_CMD[@]}" "cd '$DEPLOY_REMOTE_DIR' && docker compose build app migrate"

# ------------------------------------------------------------------------------
# 5. Execução das Migrations
# ------------------------------------------------------------------------------

echo "==> [Passo 4/5] Aplicando migrations..."
if ! "${SSH_CMD[@]}" "cd '$DEPLOY_REMOTE_DIR' && docker compose run --rm migrate"; then
  echo "ERRO: Falha ao executar migrations! A aplicação nova NÃO será inicializada." >&2
  echo "A versão anterior continua em execução. Verifique os logs e o backup." >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 6. Reinicialização da Aplicação
# ------------------------------------------------------------------------------

echo "==> [Passo 5/5] Subindo a nova versão da aplicação..."
"${SSH_CMD[@]}" "cd '$DEPLOY_REMOTE_DIR' && docker compose up -d app"

# ------------------------------------------------------------------------------
# 7. Healthchecks e Validação Pós-Deploy
# ------------------------------------------------------------------------------

echo "==> Aguardando inicialização do container..."
sleep 5

echo "==> Verificando healthcheck local no servidor (127.0.0.1:$DEPLOY_APP_PORT/api/health)..."
"${SSH_CMD[@]}" "
  for i in {1..10}; do
    STATUS=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$DEPLOY_APP_PORT/api/health || true)
    if [ \"\$STATUS\" = \"200\" ]; then
      echo 'Healthcheck local OK (HTTP 200).'
      exit 0
    fi
    echo \"Aguardando healthcheck local... (\$i/10) status=\$STATUS\"
    sleep 3
  done
  echo 'ERRO: Healthcheck local falhou após timeout!' >&2
  exit 1
"

echo "==> Verificando healthcheck público ($PUBLIC_HEALTH_URL)..."
for i in {1..10}; do
  PUB_STATUS="$(curl -s -o /dev/null -w "%{http_code}" "$PUBLIC_HEALTH_URL" || true)"
  if [[ "$PUB_STATUS" == "200" ]]; then
    echo "Healthcheck público OK (HTTP 200)."
    break
  fi
  echo "Aguardando healthcheck público... ($i/10) status=$PUB_STATUS"
  sleep 3
  if [[ "$i" -eq 10 ]]; then
    echo "AVISO: Healthcheck público não retornou 200 após 10 tentativas. Verifique o Cloudflare Tunnel." >&2
  fi
done

echo "==> Verificando status do container no servidor..."
"${SSH_CMD[@]}" "docker ps --filter name=contasdecasa"

echo ""
echo "=============================================================================="
echo " Deploy do commit $CURRENT_COMMIT concluído com sucesso!"
echo " Backup preservado em: $BACKUP_FILE"
echo "=============================================================================="
