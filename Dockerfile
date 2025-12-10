FROM node:20-alpine


WORKDIR /app


# Dependencias del sistema necesarias para Prisma en Alpine y para el wait (nc)
RUN apk add --no-cache libc6-compat openssl netcat-openbsd bash


# Instala deps
COPY package.json package-lock.json* ./
RUN npm install --production=false


# Copia código y Prisma
COPY . .
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Genera el cliente de Prisma (IMPORTANTE: antes de compilar)
RUN npx prisma generate

# Compila
RUN npm run build


EXPOSE 3000


ENTRYPOINT ["./docker-entrypoint.sh"]