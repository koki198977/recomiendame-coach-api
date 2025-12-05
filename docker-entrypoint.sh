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

# Verificar si existe la tabla de migraciones
echo "🔍 Verificando estado de migraciones..."
MIGRATE_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$MIGRATE_STATUS" | grep -q "relation \"_prisma_migrations\" does not exist"; then
  echo "⚠️  Base de datos sin historial de migraciones. Haciendo baseline..."
  # Crear tabla de migraciones y marcar todas como aplicadas (baseline)
  npx prisma migrate resolve --applied "20251009190655_init"
  npx prisma migrate resolve --applied "20251010111311_add_password_reset_relation"
  npx prisma migrate resolve --applied "20251010175151_fix_user_relations"
  npx prisma migrate resolve --applied "20251016195348_add_user_role"
  npx prisma migrate resolve --applied "20251017152936_add_email_verification"
  npx prisma migrate resolve --applied "20251022191036_add_account_deletion"
  npx prisma migrate resolve --applied "20251027232858_add_cascade_delete"
  npx prisma migrate resolve --applied "20251128123701_add_workout_coach"
  npx prisma migrate resolve --applied "20251128125900_add_chapi_mind"
  echo "✅ Baseline completado"
elif echo "$MIGRATE_STATUS" | grep -q "Drift detected"; then
  echo "⚠️  Detectado drift, resolviendo automáticamente..."
  npx prisma migrate resolve --applied "20251009190655_init" 2>/dev/null || true
  npx prisma migrate resolve --applied "20251010111311_add_password_reset_relation" 2>/dev/null || true
  npx prisma migrate resolve --applied "20251010175151_fix_user_relations" 2>/dev/null || true
  npx prisma migrate resolve --applied "20251016195348_add_user_role" 2>/dev/null || true
  npx prisma migrate resolve --applied "20251017152936_add_email_verification" 2>/dev/null || true
  npx prisma migrate resolve --applied "20251022191036_add_account_deletion" 2>/dev/null || true
  npx prisma migrate resolve --applied "20251027232858_add_cascade_delete" 2>/dev/null || true
  npx prisma migrate resolve --applied "20251128123701_add_workout_coach" 2>/dev/null || true
  npx prisma migrate resolve --applied "20251128125900_add_chapi_mind" 2>/dev/null || true
  echo "✅ Drift resuelto"
fi

# Aplica migraciones pendientes
echo "🚀 Aplicando migraciones pendientes..."
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