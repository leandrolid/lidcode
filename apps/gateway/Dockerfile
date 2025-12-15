FROM nginx:alpine

WORKDIR /etc/nginx

RUN rm -f conf.d/default.conf templates/default.conf.template
COPY apps/gateway/templates ./templates/

CMD ["nginx", "-g", "daemon off;"]
