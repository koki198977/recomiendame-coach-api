#!/bin/bash

# Script para aplicar migraciones en producción
# Uso: ./scripts/deploy-migrations.sh

set -e

echo "🔍 Verificando conexión a la base de datos..."

# Cargar variables de entorno si existe .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

echo "📦 Generando Prisma Client..."
npx prisma generate

echo "🚀 Aplicando migraciones pendientes..."
npx prisma migrate deploy

echo "✅ Migraciones aplicadas exitosamente!"

# Opcional: Mostrar estado de migraciones
echo ""
echo "📊 Estado de migraciones:"
npx prisma migrate status
