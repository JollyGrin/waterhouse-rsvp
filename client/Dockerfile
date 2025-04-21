FROM node:22-slim

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

COPY . ./

RUN npm run build

ENTRYPOINT ["node", "build/index.js"]
