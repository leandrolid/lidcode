FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/auth-server ./apps/auth-server/
RUN npm ci --workspace=auth-server && npm run build --workspace=auth-server

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/apps/auth-server/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/auth-server/dist ./dist

EXPOSE 8080

CMD ["npm", "run", "start"]
