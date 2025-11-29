FROM node:jod-alpine3.21

RUN apk add pnpm
RUN mkdir /opt/app

COPY .. /opt/app

WORKDIR /opt/app

RUN pnpm install

CMD ["pnpm", "dev"]