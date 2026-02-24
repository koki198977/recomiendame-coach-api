#!/bin/bash

echo "🔧 Arreglando versión de collation en PostgreSQL..."

# Ejecutar el comando en el contenedor de PostgreSQL
docker-compose exec db psql -U nest -d coach -c "ALTER DATABASE coach REFRESH COLLATION VERSION;"

echo "✅ Collation version actualizada"

# Verificar que no haya más warnings
echo ""
echo "🔍 Verificando..."
docker-compose exec db psql -U nest -d coach -c "SELECT datname, datcollate, datcollversion FROM pg_database WHERE datname = 'coach';"

echo ""
echo "✅ Listo! El warning debería desaparecer en el próximo reinicio."