FROM node:26-alpine AS build

WORKDIR /app

RUN npm install -g corepack && corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build
RUN node bin/run.js _

FROM node:26-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg && npm install -g corepack && corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /root/.cache /root/.cache
COPY --from=build /app/bin /app/bin
COPY --from=build /app/dist /app/dist

ENTRYPOINT ["node", "bin/run.js", "--output-prefix", "output/"]
