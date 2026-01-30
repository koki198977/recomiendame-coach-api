# 🧪 Comandos cURL para Probar Chapi 2.0

## 🔐 1. Obtener Token de Autenticación

Primero necesitas autenticarte para obtener un JWT token:

```bash
# Login para obtener token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu_email@ejemplo.com",
    "password": "tu_password"
  }'
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "tu_email@ejemplo.com"
  }
}
```

**⚠️ Importante**: Copia el `access_token` y úsalo en los siguientes comandos reemplazando `YOUR_JWT_TOKEN`.

---

## 💬 2. Conversar con Chapi 2.0

### Primer mensaje (saludo)
```bash
curl -X POST http://localhost:3000/chapi-v2/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¡Hola Chapi! ¿Cómo estás?"
  }'
```

### Pregunta sobre progreso
```bash
curl -X POST http://localhost:3000/chapi-v2/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cómo va mi progreso esta semana?",
    "sessionId": "session-123"
  }'
```

### Pregunta emocional
```bash
curl -X POST http://localhost:3000/chapi-v2/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Me siento un poco desmotivado últimamente, ¿puedes ayudarme?",
    "sessionId": "session-123"
  }'
```

### Pregunta sobre objetivos
```bash
curl -X POST http://localhost:3000/chapi-v2/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Estoy cerca de alcanzar mi objetivo de peso?",
    "sessionId": "session-123"
  }'
```

### Solicitar recomendaciones
```bash
curl -X POST http://localhost:3000/chapi-v2/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Qué me recomiendas para mejorar mi rutina de ejercicio?",
    "sessionId": "session-123"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "response": {
      "message": "¡Hola! He revisado tu perfil y veo que...",
      "messageType": "conversational",
      "personalizedInsights": {
        "basedOnHistory": ["Insight 1", "Insight 2"],
        "predictiveAnalysis": "Análisis basado en tus datos",
        "recommendations": [...]
      },
      "followUpSuggestions": [
        "¿Cómo te sientes hoy?",
        "¿Quieres revisar tu progreso?"
      ]
    },
    "conversationId": "msg-id-123",
    "sessionId": "session-123"
  }
}
```

---

## 📚 3. Obtener Historial de Conversaciones

### Historial completo (últimos 50 mensajes)
```bash
curl -X GET http://localhost:3000/chapi-v2/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Historial limitado (últimos 10 mensajes)
```bash
curl -X GET "http://localhost:3000/chapi-v2/conversations?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Buscar en conversaciones
```bash
curl -X GET "http://localhost:3000/chapi-v2/conversations?search=peso&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Historial por rango de fechas
```bash
curl -X GET "http://localhost:3000/chapi-v2/conversations?from=2024-01-01&to=2024-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "¡Hola Chapi!",
        "timestamp": "2024-01-30T10:00:00Z",
        "messageType": "text"
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "¡Hola! ¿Cómo estás hoy?",
        "timestamp": "2024-01-30T10:00:05Z",
        "messageType": "conversational"
      }
    ],
    "totalCount": 25,
    "conversationStats": {
      "totalMessages": 50,
      "averageMessagesPerDay": 3.2,
      "mostCommonEmotions": [
        {"emotion": "MOTIVATION", "count": 8},
        {"emotion": "CURIOSITY", "count": 5}
      ]
    },
    "conversationSummary": "Usuario activo que consulta regularmente sobre progreso..."
  }
}
```

---

## 🔍 4. Obtener Insights Proactivos

```bash
curl -X GET http://localhost:3000/chapi-v2/insights \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "insights": [
      "Tu patrón de sueño ha mejorado 15% en las últimas 2 semanas",
      "Detecté que tiendes a saltarte el desayuno los lunes",
      "Tu adherencia nutricional es excelente (87%)"
    ],
    "recommendations": [
      {
        "type": "nutrition_adjustment",
        "title": "Mejorar desayunos",
        "description": "Preparar desayunos los domingos",
        "priority": "medium"
      }
    ],
    "predictiveAlerts": [
      "Riesgo bajo de abandono - excelente consistencia",
      "Oportunidad: estás cerca de tu objetivo semanal"
    ],
    "userContext": {
      "todayProgress": {
        "checkinCompleted": true,
        "hydrationProgress": 0.75,
        "mealsLogged": 2,
        "workoutCompleted": false
      }
    },
    "conversationOpportunities": {
      "suggestedTopics": ["Hidratación", "Ejercicio"],
      "followUpQuestions": [
        "¿Has estado tomando suficiente agua?",
        "¿Tienes planes de hacer ejercicio hoy?"
      ]
    }
  }
}
```

---

## 📊 5. Obtener Estadísticas de Conversación

```bash
curl -X GET http://localhost:3000/chapi-v2/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "conversationStats": {
      "totalMessages": 127,
      "averageMessagesPerDay": 4.2,
      "mostCommonEmotions": [
        {"emotion": "MOTIVATION", "count": 15},
        {"emotion": "CURIOSITY", "count": 12},
        {"emotion": "CONCERN", "count": 8}
      ],
      "mostDiscussedTopics": [
        {"topic": "peso", "count": 23},
        {"topic": "ejercicio", "count": 18},
        {"topic": "sueño", "count": 12}
      ]
    },
    "conversationSummary": "Usuario muy activo que consulta regularmente sobre su progreso. Muestra alta motivación y compromiso con sus objetivos de salud."
  }
}
```

---

## 🔧 6. Obtener Información de Contexto

```bash
curl -X GET http://localhost:3000/chapi-v2/context \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Contexto disponible a través de los otros endpoints",
  "availableEndpoints": {
    "chat": "POST /chapi-v2/chat - Conversar con Chapi",
    "conversations": "GET /chapi-v2/conversations - Historial de conversaciones",
    "insights": "GET /chapi-v2/insights - Insights proactivos personalizados"
  }
}
```

---

## 🧪 7. Script de Prueba Completa

Aquí tienes un script bash que prueba todos los endpoints en secuencia:

```bash
#!/bin/bash

# Configuración
BASE_URL="http://localhost:3000"
EMAIL="tu_email@ejemplo.com"
PASSWORD="tu_password"

echo "🚀 Iniciando pruebas de Chapi 2.0..."

# 1. Login
echo "🔐 1. Obteniendo token de autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Error: No se pudo obtener el token"
  echo "Respuesta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:20}..."

# 2. Chat - Saludo
echo "💬 2. Enviando saludo a Chapi 2.0..."
curl -s -X POST $BASE_URL/chapi-v2/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"¡Hola Chapi! ¿Cómo estás?"}' | jq '.'

# 3. Chat - Pregunta sobre progreso
echo "📊 3. Preguntando sobre progreso..."
curl -s -X POST $BASE_URL/chapi-v2/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Cómo va mi progreso esta semana?","sessionId":"test-session"}' | jq '.'

# 4. Obtener insights
echo "🔍 4. Obteniendo insights proactivos..."
curl -s -X GET $BASE_URL/chapi-v2/insights \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 5. Obtener historial
echo "📚 5. Obteniendo historial de conversaciones..."
curl -s -X GET "$BASE_URL/chapi-v2/conversations?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Obtener estadísticas
echo "📊 6. Obteniendo estadísticas..."
curl -s -X GET $BASE_URL/chapi-v2/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo "🎉 ¡Pruebas completadas!"
```

---

## ⚠️ Notas Importantes

1. **Reemplaza `YOUR_JWT_TOKEN`** con el token real obtenido del login
2. **Cambia la URL base** si tu servidor no está en `localhost:3000`
3. **Instala jq** para formatear JSON: `brew install jq` (macOS) o `apt install jq` (Ubuntu)
4. **Asegúrate de tener**:
   - ✅ Servidor corriendo (`npm run start:dev`)
   - ✅ Base de datos conectada
   - ✅ OpenAI API key configurada (para respuestas reales)
   - ✅ Migración aplicada (para funcionalidad completa)

## 🔧 Troubleshooting

### Error 401 (Unauthorized)
```bash
# Verifica que el token sea válido
curl -X GET http://localhost:3000/me/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Error 500 (Internal Server Error)
- Verifica que OpenAI API key esté configurada
- Revisa los logs del servidor
- Asegúrate de que la migración esté aplicada

### Error 404 (Not Found)
- Verifica que el módulo ChapiV2Module esté importado en app.module.ts
- Asegúrate de que el servidor esté corriendo

---

¡Con estos comandos puedes probar completamente toda la funcionalidad de Chapi 2.0! 🚀