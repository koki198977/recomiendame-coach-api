#!/bin/sh
set -e


echo "✅ Esperando que la base de datos esté disponible..."
# Esperar hasta que la base de datos responda en el host `db:5432`
until nc -z db 5432; do
echo "⏳ Esperando a que db:5532 esté disponible..."
sleep 2
done


echo "✅ Base de datos disponible. Ejecutando Prisma..."
# Genera client
npx prisma generate

# Aplica migraciones de forma segura (sin perder datos)
if [ "$NODE_ENV" = "development" ]; then
  echo "🔧 Modo desarrollo: usando migrate dev"
  npx prisma migrate dev --skip-generate
else
  echo "🚀 Modo producción: usando migrate deploy"
  npx prisma migrate deploy
fi

# Si definiste seed (package.json -> prisma.seed), descomenta:
# npx prisma db seed || true


if [ "$NODE_ENV" = "development" ]; then
echo "🚀 Iniciando la aplicación en modo dev (watch)..."
exec npm run start:dev
else
echo "🚀 Iniciando la aplicación en modo prod..."
exec node dist/main.js
fi