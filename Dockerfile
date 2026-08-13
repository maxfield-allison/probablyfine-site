# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Fonts for build-time OG card generation (sharp/librsvg renders SVG text using
# system fonts; node:alpine ships none, so titles render as tofu without this).
# DejaVu provides sans-serif + monospace glyphs for the card template.
RUN apk add --no-cache fontconfig ttf-dejavu && fc-cache -f

RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- Runtime stage ----
FROM nginx:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN chown -R 101:101 /usr/share/nginx/html /var/cache/nginx \
    && touch /run/nginx.pid && chown 101:101 /run/nginx.pid

USER 101
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
