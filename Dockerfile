FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .

RUN npm run build
RUN node bin/run.js _

FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --omit=dev

COPY --from=build /root/.cache /root/.cache
COPY --from=build /app/bin /app/bin
COPY --from=build /app/dist /app/dist

ENTRYPOINT ["node", "bin/run.js", "-o", "output/{id}-{count}.{if-type:png:mp4:json:}"]