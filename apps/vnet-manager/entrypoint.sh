#!/bin/bash

# Falha se houver erro
set -e

# Verifica se a URL da app foi definida (necessário para o Headscale)
if [ -z "$APP_URL" ]; then
  echo "Erro: APP_URL não definida."
  exit 1
fi

# Cria o diretório de configuração se não existir
mkdir -p /etc/headscale

# Note que alteramos 'listen_addr' para 127.0.0.1:8080 O mundo externo fala com o Caddy, o Caddy fala com o Headscale aqui.
cat <<EOF > /etc/headscale/config.yaml
server_url: $APP_URL
listen_addr: 127.0.0.1:8080
metrics_listen_addr: 127.0.0.1:9090
grpc_listen_addr: 0.0.0.0:50443
grpc_allow_insecure: false
private_key_path: /var/lib/headscale/private.key

noise:
  private_key_path: /var/lib/headscale/noise_private.key

prefixes:
  v6: fd7a:115c:a1e0::/48
  v4: 100.64.0.0/10

# Configura o Headscale para usar MagicDNS e fornece Nameservers globais.
dns:
  nameservers:
    global:
      - 1.1.1.1
      - 8.8.8.8
  magic_dns: false

# Configuração DERP (necessária para NAT traversal)
derp:
  server:
    enabled: false
  urls:
    - https://controlplane.tailscale.com/derpmap/default
  paths: []
  auto_update_enabled: true
  update_frequency: 24h

database:
  type: postgres
  postgres:
    host: $DB_HOST
    port: $DB_PORT
    name: $DB_NAME
    user: $DB_USER
    pass: $DB_PASS
    ssl: true

disable_check_updates: true
ephemeral_node_inactivity_timeout: 30m
unix_socket: /var/run/headscale/headscale.sock
EOF

# --- INICIALIZAÇÃO ---

echo "Iniciando Headscale em background..."
headscale serve &
HEADSCALE_PID=$!

# Aguarda o headscale iniciar antes de subir o proxy (opcional, mas recomendado)
sleep 5

echo "Iniciando Caddy Reverse Proxy na porta $PORT..."
# O Caddy roda em foreground, mantendo o container vivo
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
CADDY_PID=$!

# Função para matar processos se o container for encerrado
cleanup() {
    echo "Encerrando container..."
    kill $HEADSCALE_PID
    kill $CADDY_PID
}
trap cleanup SIGTERM SIGINT

# Aguarda qualquer processo encerrar
wait -n $HEADSCALE_PID $CADDY_PID