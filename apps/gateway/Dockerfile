FROM nginx:alpine

WORKDIR /etc/nginx

COPY apps/gateway/default.conf.template ./templates/default.conf.template

CMD ["/bin/sh", "-c", "envsubst '\\$PORT' < ./templates/default.conf.template > ./conf.d/default.conf && nginx -g 'daemon off;'"]