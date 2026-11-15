# bookworm-slim y no alpine: bcrypt es un módulo nativo y sus binarios precompilados usan glibc.
FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS produccion
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Directorio de archivos subidos (ALMACENAMIENTO_DIR). Docker copia este dueño al volumen la primera vez.
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
