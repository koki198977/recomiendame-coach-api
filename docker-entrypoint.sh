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

# Intentar aplicar migraciones, si falla hacer baseline
echo "🚀 Aplicando migraciones..."
if ! npx prisma migrate deploy 2>&1; then
  echo "⚠️  Error al aplicar migraciones. Haciendo baseline..."
  
  # Marcar todas las migraciones antiguas como aplicadas (baseline)
  echo "📝 Marcando migraciones existentes como aplicadas..."
  npx prisma migrate resolve --applied "20251009190655_init" || true
  npx prisma migrate resolve --applied "20251010111311_add_password_reset_relation" || true
  npx prisma migrate resolve --applied "20251010175151_fix_user_relations" || true
  npx prisma migrate resolve --applied "20251016195348_add_user_role" || true
  npx prisma migrate resolve --applied "20251017152936_add_email_verification" || true
  npx prisma migrate resolve --applied "20251022191036_add_account_deletion" || true
  npx prisma migrate resolve --applied "20251027232858_add_cascade_delete" || true
  npx prisma migrate resolve --applied "20251128123701_add_workout_coach" || true
  npx prisma migrate resolve --applied "20251128125900_add_chapi_mind" || true
  
  echo "✅ Baseline completado. Aplicando migraciones pendientes..."
  npx prisma migrate deploy
fi

echo "✅ Migraciones aplicadas correctamente"

# Si definiste seed (package.json -> prisma.seed), descomenta:
# npx prisma db seed || true


if [ "$NODE_ENV" = "development" ]; then
echo "🚀 Iniciando la aplicación en modo dev (watch)..."
exec npm run start:dev
else
echo "🚀 Iniciando la aplicación en modo prod..."
exec node dist/main.js
fi