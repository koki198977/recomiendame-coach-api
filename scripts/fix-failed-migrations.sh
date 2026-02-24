#!/bin/bash

echo "🔧 Arreglando migraciones fallidas..."

# Resolver migraciones fallidas marcándolas como aplicadas
echo "📝 Resolviendo migración fallida: 20251216000001_add_hydration_goal"
docker-compose exec app npx prisma migrate resolve --applied "20251216000001_add_hydration_goal"

echo "📝 Resolviendo migración: 20251226115803_add_user_push_token_model"
docker-compose exec app npx prisma migrate resolve --applied "20251226115803_add_user_push_token_model"

echo ""
echo "✅ Migraciones resueltas. Ahora intenta aplicar las migraciones pendientes:"
echo "   docker-compose exec app npx prisma migrate deploy"

echo ""
echo "🔍 Estado actual de las migraciones:"
docker-compose exec app npx prisma migrate status