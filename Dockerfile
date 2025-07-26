FROM node:24.4.1-alpine3.22

WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

# Enable Corepack for Yarn
RUN corepack enable

COPY .yarnrc.yml ./
COPY package.json ./
COPY yarn.lock ./

RUN yarn workspaces focus --production

COPY src ./src

CMD ["dumb-init", "node", "--require", "./.pnp.cjs", "--loader", "./.pnp.loader.mjs" , "src/server.js"]
