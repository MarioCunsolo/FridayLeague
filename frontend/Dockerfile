FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/40-generate-runtime-config.sh /docker-entrypoint.d/40-generate-runtime-config.sh
COPY --from=build /app/dist/lineup-frontend/browser /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-generate-runtime-config.sh

EXPOSE 80
