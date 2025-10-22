#!/bin/bash

# Script para probar el flujo completo de eliminación de cuenta
# Uso: ./scripts/test-account-deletion.sh test@ejemplo.com

EMAIL=${1:-"test@ejemplo.com"}
API_URL="http://localhost:3000"

echo "🧪 Probando flujo de eliminación de cuenta para: $EMAIL"
echo "=================================================="

# 1. Solicitar eliminación de cuenta
echo "1️⃣ Solicitando eliminación de cuenta..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/request-account-deletion" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}")

echo "Respuesta: $RESPONSE"
echo ""

# 2. Verificar que se puede acceder a la página de confirmación
echo "2️⃣ Verificando página de confirmación..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/confirm-account-deletion")
echo "Código HTTP de la página: $HTTP_CODE"
echo ""

# 3. Instrucciones para continuar
echo "3️⃣ Pasos siguientes:"
echo "   - Revisa tu email para obtener el token"
echo "   - Extrae el token del enlace del email"
echo "   - Ejecuta uno de estos comandos:"
echo ""
echo "   # Confirmar por POST (para apps):"
echo "   curl -X POST $API_URL/auth/confirm-account-deletion \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"token\": \"TOKEN_AQUI\"}'"
echo ""
echo "   # Confirmar por GET (simula clic en email):"
echo "   curl -X GET \"$API_URL/auth/confirm-account-deletion?token=TOKEN_AQUI\""
echo ""

# 4. Verificar que el usuario existe antes de la eliminación
echo "4️⃣ Verificando si el usuario existe..."
USER_CHECK=$(curl -s -X GET "$API_URL/users" | grep -o "\"email\":\"$EMAIL\"" || echo "No encontrado")
if [ "$USER_CHECK" != "No encontrado" ]; then
    echo "✅ Usuario encontrado en la base de datos"
else
    echo "❌ Usuario no encontrado en la base de datos"
fi
echo ""

echo "🔍 Para monitorear los logs del servidor:"
echo "   tail -f logs/app.log"
echo ""
echo "📧 Para ver los emails enviados (si usas mailtrap o similar):"
echo "   Revisa tu bandeja de entrada de pruebas"
echo ""
echo "✅ Script completado. Revisa tu email para continuar con la eliminación."