#!/bin/sh
set -e


echo "✅ Esperando que la base de datos esté disponible..."
# Esperar hasta que la base de datos responda en el host `db:5432`
until nc -z db 5432; do
echo "⏳ Esperando a que db:5532 esté disponible..."
sleep 2
done


echo "✅ Base de datos disponible. Ejecutando Prisma..."
# Genera client y aplica migraciones (usa `deploy` para idempotente en contenedor)
npx prisma generate
npx prisma migrate deploy


# Si definiste seed (package.json -> prisma.seed), descomenta:
# npx prisma db seed || true


if [ "$NODE_ENV" = "development" ]; then
echo "🚀 Iniciando la aplicación en modo dev (watch)..."
exec npm run start:dev
else
echo "🚀 Iniciando la aplicación en modo prod..."
exec node dist/main.js
fi