# Build
FROM node:22-alpine AS build

ARG SERVER
ENV VITE_SHORTLID_URL=${SERVER}

WORKDIR /app

COPY package.json package-lock.json configs/default.conf ./
COPY apps/shortlid-web ./apps/shortlid-web/
RUN npm ci --workspace=shortlid-web && npm run build --workspace=shortlid-web

# Production
FROM nginx:alpine AS production

COPY --from=build /app/apps/shortlid-web/dist /usr/share/nginx/html
# COPY configs/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]