FROM node:22.14.0-alpine3.21

# Set working directory
WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

# Enable Corepack for Yarn
RUN corepack enable

# Copy Yarn configuration and lock files
COPY .yarnrc.yml ./
COPY package.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --immutable

COPY src ./src

CMD ["dumb-init", "node", "--require", "./.pnp.cjs", "--loader", "./.pnp.loader.mjs" , "src/server.js"]
