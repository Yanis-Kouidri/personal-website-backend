FROM node:24.10.0-alpine3.22

WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

COPY package.json ./
COPY package-lock.json ./

RUN npm ci --only=production

COPY src ./src


RUN mkdir -p /app/data && chown -R nobody:nogroup /app/data


USER nobody

CMD ["dumb-init", "node", "src/server.js"]
