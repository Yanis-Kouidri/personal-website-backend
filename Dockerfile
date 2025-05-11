FROM node:22.14.0-bullseye-slim 

# Set working directory
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

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
