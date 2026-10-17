FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/auth-server ./apps/auth-server
COPY apps/auth-web ./apps/auth-web

RUN npm ci --workspace=auth-server --workspace=auth-web --include-workspace-root
RUN npm run build --workspace=@lidcode/elements \
    && npm run build --workspace=auth-web --workspace=auth-server

FROM build AS dependencies

RUN npm prune --omit=dev --workspace=auth-server --include-workspace-root \
    && mkdir -p apps/auth-server/node_modules

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/auth-server/node_modules ./apps/auth-server/node_modules
COPY --from=build /app/apps/auth-server/package.json ./apps/auth-server/package.json
COPY --from=build /app/apps/auth-server/dist ./apps/auth-server/dist
COPY --from=build /app/apps/auth-web/dist ./apps/auth-web/dist

USER node
EXPOSE 3334

CMD ["node", "apps/auth-server/dist/index.js"]
