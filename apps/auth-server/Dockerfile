FROM node:22-alpine

USER node

WORKDIR /app

COPY apps/auth-server ./

EXPOSE 3333

CMD ["npm", "run", "start"]