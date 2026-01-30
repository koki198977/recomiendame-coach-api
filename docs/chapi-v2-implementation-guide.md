# 🤖 Chapi 2.0 - Asistente Inteligente Personalizado

## 📋 Resumen

Chapi 2.0 es una evolución completa del asistente emocional actual, transformándolo en un asistente inteligente y personalizado que:

- **Recuerda todas las conversaciones** anteriores del usuario
- **Accede a toda la información** del perfil, salud, objetivos y patrones
- **Genera respuestas personalizadas** basadas en el contexto completo
- **Proporciona insights predictivos** basados en análisis de datos
- **Mantiene conversaciones naturales** sin ser robotizado

## 🏗️ Arquitectura

### Componentes Principales

1. **ChapiV2Agent** - Motor de IA (OpenAI) que genera respuestas personalizadas
2. **ConversationMemory** - Gestiona el historial completo de conversaciones
3. **UserProfileAggregator** - Recopila y analiza todos los datos del usuario
4. **ChatWithChapiV2UseCase** - Orquesta la conversación completa

### Flujo de Conversación

```
Usuario envía mensaje
    ↓
Obtener perfil completo del usuario
    ↓
Obtener contexto conversacional
    ↓
Generar respuesta personalizada con IA
    ↓
Guardar mensaje y respuesta
    ↓
Actualizar contexto conversacional
    ↓
Devolver respuesta al usuario
```

## 🚀 Instalación y Configuración

### 1. Migración de Base de Datos

Ejecutar la migración SQL para agregar las nuevas tablas:

```sql
-- Ejecutar el contenido de docs/chapi-v2-migration.sql
```

O si Prisma funciona correctamente:

```bash
npx prisma migrate dev --name add-chapi-v2-conversation-messages
```

### 2. Configuración de Variables de Entorno

Asegúrate de tener configurado:

```env
OPENAI_API_KEY=tu_api_key_aqui
OPENAI_MODEL=gpt-4o  # o gpt-4o-mini para menor costo
OPENAI_TIMEOUT_MS=45000
```

### 3. Generar Cliente de Prisma

```bash
npx prisma generate
```

### 4. Verificar Instalación

```bash
# Prueba simple sin migración
npm run ts-node scripts/test-chapi-v2-simple.ts

# Prueba completa (requiere migración)
npm run ts-node scripts/test-chapi-v2.ts
```

## 📡 Endpoints de la API

### POST /chapi-v2/chat
Conversar con Chapi 2.0

**Request:**
```json
{
  "message": "¡Hola Chapi! ¿Cómo va mi progreso?",
  "sessionId": "optional-session-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": {
      "message": "¡Hola Juan! He revisado tu progreso y veo que...",
      "messageType": "conversational",
      "personalizedInsights": {
        "basedOnHistory": ["Insights específicos del usuario"],
        "predictiveAnalysis": "Análisis predictivo",
        "recommendations": [...]
      },
      "followUpSuggestions": ["¿Cómo te sientes hoy?", "..."]
    },
    "conversationId": "msg-id",
    "sessionId": "session-id"
  }
}
```

### GET /chapi-v2/conversations
Obtener historial de conversaciones

**Query Parameters:**
- `limit`: Número de mensajes (default: 50)
- `search`: Buscar en contenido
- `from`: Fecha desde (ISO string)
- `to`: Fecha hasta (ISO string)

### GET /chapi-v2/insights
Obtener insights proactivos personalizados

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": ["Insight 1", "Insight 2"],
    "recommendations": [...],
    "predictiveAlerts": [...],
    "userContext": {...},
    "conversationOpportunities": {...}
  }
}
```

### GET /chapi-v2/stats
Obtener estadísticas de conversación

## 🧠 Capacidades de Chapi 2.0

### Datos Disponibles para Personalización

- **Perfil completo**: Edad, peso, altura, objetivos, motivación
- **Condiciones de salud**: Alergias, enfermedades, restricciones
- **Historial de seguimiento**: Check-ins, hidratación, sueño, actividad
- **Datos emocionales**: Logs emocionales anteriores, patrones
- **Planes y objetivos**: Planes nutricionales, entrenamientos, metas
- **Comportamiento social**: Posts, logros, rachas
- **Patrones identificados**: Sueño, actividad, nutrición, adherencia

### Tipos de Respuestas

1. **Conversacional**: Respuestas naturales y empáticas
2. **Analítica**: Análisis de datos y progreso
3. **Motivacional**: Mensajes de apoyo y motivación
4. **Educativa**: Información y consejos personalizados

### Insights Personalizados

- **Basados en historial**: Referencias a conversaciones y datos anteriores
- **Análisis predictivo**: Predicciones basadas en patrones
- **Recomendaciones específicas**: Acciones personalizadas para el usuario

## 🔧 Desarrollo y Extensión

### Agregar Nuevos Tipos de Análisis

1. Extender `UserProfileAggregatorPort` con nuevos métodos
2. Implementar análisis en `UserProfileAggregatorPrismaRepository`
3. Actualizar prompts en `OpenAIChapiV2Agent`

### Personalizar Respuestas

Modificar los prompts del sistema en `OpenAIChapiV2Agent.buildSystemPrompt()`:

```typescript
private buildSystemPrompt(userProfile: UserCompleteProfile, conversationContext: UserConversationContext): string {
  return `Eres Chapi 2.0, un asistente personalizado que...
  
  PERSONALIDAD ESPECÍFICA PARA ESTE USUARIO:
  - Estilo de comunicación: ${conversationContext.userPersonality.communicationStyle}
  - Temas preferidos: ${conversationContext.userPersonality.preferredTopics.join(', ')}
  - Patrones emocionales: ${conversationContext.userPersonality.emotionalPatterns.join(', ')}
  
  CONTEXTO ESPECÍFICO:
  - Objetivo principal: ${userProfile.profile.nutritionGoal}
  - Condiciones importantes: ${userProfile.conditions.join(', ')}
  - Progreso reciente: [análisis automático]
  
  INSTRUCCIONES PERSONALIZADAS:
  - Siempre menciona el progreso específico del usuario
  - Haz referencia a conversaciones anteriores relevantes
  - Adapta el tono según su personalidad
  - Proporciona recomendaciones basadas en sus datos reales
  `;
}
```

### Agregar Nuevos Endpoints

1. Crear nuevo caso de uso en `src/core/application/chapi-v2/use-cases/`
2. Agregar endpoint en `ChapiV2Controller`
3. Registrar en `ChapiV2Module`

## 🧪 Testing

### Pruebas Unitarias

```bash
# Probar casos de uso individuales
npm test -- --testPathPattern=chapi-v2

# Probar integración con OpenAI
npm test -- --testPathPattern=chapi-v2.agent

# Probar repositorios
npm test -- --testPathPattern=conversation-memory
```

### Pruebas de Integración

```bash
# Prueba completa del flujo
npm run ts-node scripts/test-chapi-v2.ts

# Prueba de endpoints
curl -X POST http://localhost:3000/chapi-v2/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola Chapi, ¿cómo estoy progresando?"}'
```

## 📊 Monitoreo y Métricas

### Métricas Importantes

- **Engagement**: Mensajes por usuario por día
- **Satisfacción**: Análisis de sentimiento de respuestas
- **Personalización**: Uso de datos específicos del usuario
- **Retención**: Usuarios que regresan a conversar

### Logs y Debugging

```typescript
// Habilitar logs detallados
console.log('Chapi V2 - User Profile:', userProfile);
console.log('Chapi V2 - Conversation Context:', conversationContext);
console.log('Chapi V2 - Generated Response:', chapiResponse);
```

## 🔒 Consideraciones de Privacidad

- **Datos sensibles**: Toda la información del usuario se usa para personalización
- **Retención**: Los mensajes se almacenan indefinidamente (considerar políticas de retención)
- **Anonimización**: Para análisis agregados, anonimizar datos de usuarios
- **Consentimiento**: Informar a usuarios sobre el nivel de personalización

## 🚀 Roadmap Futuro

### Fase 1 (Actual)
- ✅ Conversaciones personalizadas básicas
- ✅ Memoria conversacional
- ✅ Acceso a datos completos del usuario

### Fase 2
- 🔄 Análisis de sentimientos avanzado
- 🔄 Recomendaciones proactivas automáticas
- 🔄 Integración con notificaciones push

### Fase 3
- 📋 Respuestas multimodales (texto + acciones)
- 📋 Análisis predictivo avanzado
- 📋 Personalización de personalidad del asistente

### Fase 4
- 📋 Integración con wearables
- 📋 Análisis de voz y emociones
- 📋 Asistente proactivo 24/7

## 🤝 Contribución

Para contribuir al desarrollo de Chapi 2.0:

1. Revisar la arquitectura actual
2. Identificar áreas de mejora
3. Implementar siguiendo los patrones establecidos
4. Agregar pruebas correspondientes
5. Documentar cambios

---

**¡Chapi 2.0 representa el futuro de los asistentes de salud personalizados!** 🚀