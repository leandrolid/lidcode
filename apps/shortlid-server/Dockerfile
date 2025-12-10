FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/shortlid-server ./apps/shortlid-server/
RUN npm ci --workspace=shortlid-server && npm run build --workspace=shortlid-server

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/apps/shortlid-server/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/shortlid-server/dist ./dist

EXPOSE 8080

CMD ["npm", "run", "start"]