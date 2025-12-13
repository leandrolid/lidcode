FROM headscale/headscale:latest AS source

FROM alpine:latest

RUN apk add --no-cache bash curl unzip caddy ca-certificates

COPY --from=source /ko-app/headscale /usr/local/bin/headscale

WORKDIR /var/www/web-ui
RUN curl -L https://github.com/gurucomputing/headscale-ui/releases/latest/download/headscale-ui.zip -o ui.zip && \
    unzip ui.zip && \
    rm ui.zip

WORKDIR /

COPY apps/vnet-manager/entrypoint.sh /entrypoint.sh
COPY apps/vnet-manager/Caddyfile /etc/caddy/Caddyfile

RUN chmod +x /entrypoint.sh && \
    chmod +x /usr/local/bin/headscale && \
    mkdir -p /var/lib/headscale && \
    mkdir -p /var/run/headscale

ENTRYPOINT ["/entrypoint.sh"]