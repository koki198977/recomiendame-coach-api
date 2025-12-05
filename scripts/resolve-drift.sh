#!/bin/bash

# Script para resolver drift de migraciones en producción
# Marca todas las migraciones existentes como aplicadas

set -e

echo "🔍 Resolviendo drift de migraciones..."

# Lista de migraciones a marcar como aplicadas
migrations=(
  "20251009190655_init"
  "20251010111311_add_password_reset_relation"
  "20251010175151_fix_user_relations"
  "20251016195348_add_user_role"
  "20251017152936_add_email_verification"
  "20251022191036_add_account_deletion"
  "20251027232858_add_cascade_delete"
  "20251128123701_add_workout_coach"
  "20251128125900_add_chapi_mind"
)

for migration in "${migrations[@]}"; do
  echo "✅ Marcando como aplicada: $migration"
  npx prisma migrate resolve --applied "$migration" || true
done

echo ""
echo "🚀 Aplicando migraciones pendientes..."
npx prisma migrate deploy

echo ""
echo "✅ Drift resuelto exitosamente!"
echo ""
echo "📊 Estado final de migraciones:"
npx prisma migrate status
