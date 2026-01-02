FROM node:24.12.0-alpine3.22

RUN apk add --no-cache dumb-init

WORKDIR /app

RUN mkdir -p /app/data && chown -R nobody:nobody /app/data

ENV NODE_ENV=production

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

USER nobody

CMD ["dumb-init", "node", "src/server.js"]
