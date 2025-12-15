FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/home-site ./apps/home-site/
COPY packages ./packages/
RUN npm ci && npm run build --workspace=home-site

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/apps/home-site/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/home-site/.next ./.next
COPY --from=build /app/apps/home-site/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]