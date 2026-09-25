FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev


FROM node:20-alpine

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY proxy ./proxy
COPY public ./public

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
