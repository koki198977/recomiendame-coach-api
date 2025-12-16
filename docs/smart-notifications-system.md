# 🔔 Sistema de Notificaciones Inteligentes

Un sistema completo de notificaciones contextuales y personalizadas para apps de salud y bienestar.

## 🎯 Características Principales

### 🍽️ Notificaciones Nutricionales
- **Adherencia a Planes**: Detecta cuando la adherencia baja del 70% por 3+ días
- **Registro Incompleto**: Alerta cuando faltan registros de comidas por 2+ días  
- **Desequilibrio Nutricional**: Analiza macros vs objetivos semanales
- **Saltarse Comidas**: Identifica patrones de comidas omitidas frecuentemente

### 💧 Notificaciones de Hidratación
- **Hidratación Insuficiente**: Alerta cuando el consumo diario < 75% del objetivo
- **Patrones de Deshidratación**: Detecta promedios semanales bajos por 2+ semanas

### 😴 Notificaciones de Sueño
- **Sueño Insuficiente**: Alerta por < 6 horas durante 3+ días
- **Calidad Baja**: Detecta puntuaciones de calidad < 3/5 por varios días

### 🏃‍♂️ Notificaciones de Actividad Física
- **Entrenamientos Incompletos**: Detecta 3+ entrenamientos pendientes
- **Sedentarismo**: Alerta por < 5000 pasos diarios
- **Sobreentrenamiento**: Previene entrenamientos excesivos sin descanso

### 🎯 Notificaciones de Objetivos
- **Objetivo Próximo**: Celebra cuando estás cerca de tu meta (< 1.5kg)
- **Objetivo Muy Ambicioso**: Sugiere ajustes para metas irrealistas

### 🏆 Notificaciones de Gamificación
- **Racha en Peligro**: Protege rachas de 7+ días sin actividad hoy
- **Nuevos Logros**: Notifica cuando estás cerca de desbloquear achievements

### 🧠 Notificaciones de Bienestar Emocional
- **Patrones Negativos**: Detecta 3+ emociones negativas consecutivas
- **Progreso Emocional**: Celebra mejoras en el estado emocional

### 🩺 Notificaciones de Salud
- **Diabetes**: Monitorea carbohidratos altos y recuerda medir glucosa
- **Hipertensión**: Alerta sobre sodio alto y recuerda medir presión
- **Alergias**: Detecta posibles alérgenos en registros de comidas
- **Enfermedad Cardíaca**: Monitorea ejercicio intenso y síntomas

### 🌤️ Notificaciones Contextuales
- **Clima Perfecto**: Sugiere ejercicio al aire libre en días ideales
- **Clima Extremo**: Ajusta recomendaciones por calor, lluvia o UV alto
- **Fechas Especiales**: Celebra cumpleaños, aniversarios y logros
- **Motivación Semanal**: Mensajes motivacionales los lunes

### 🤖 Análisis Inteligente
- **Correlaciones**: Detecta patrones como sueño-hambre, actividad-adherencia
- **Predicción de Abandono**: Identifica usuarios en riesgo usando ML
- **Insights Personalizados**: Genera recomendaciones basadas en datos

## 🏗️ Arquitectura

```
src/modules/
├── notifications.service.ts              # Servicio principal
├── notification-triggers.service.ts      # Triggers automáticos con cron
├── smart-analytics.service.ts            # Análisis de correlaciones
├── health-aware-notifications.service.ts # Notificaciones por condiciones
├── contextual-notifications.service.ts   # Notificaciones contextuales
└── notifications.controller.ts           # API endpoints
```

## 🔧 Configuración

### 1. Instalar Dependencias
```bash
npm install @nestjs/schedule
```

### 2. Agregar al App Module
```typescript
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationsModule,
    // ...
  ],
})
```

### 3. Variables de Entorno
```env
# APIs externas (opcional)
WEATHER_API_KEY=your_weather_api_key
PUSH_NOTIFICATION_KEY=your_push_key
```

## 📱 API Endpoints

### Obtener Notificaciones
```http
GET /notifications?userId=123
```

### Marcar como Leída
```http
POST /notifications/:id/read?userId=123
```

### Trigger Manual
```http
POST /notifications/trigger/nutritional_balance
{
  "userId": "123"
}
```

### Análisis de Usuario
```http
GET /notifications/analytics/:userId
```

## 🧪 Testing

Ejecuta el script de prueba para ver el sistema en acción:

```bash
npx ts-node scripts/test-notification-system.ts
```

Este script:
1. Crea un usuario de prueba con condiciones de salud
2. Simula datos que activan diferentes triggers
3. Muestra las notificaciones que se generarían
4. Limpia los datos de prueba

## 🔄 Cron Jobs Configurados

| Frecuencia | Trigger | Descripción |
|------------|---------|-------------|
| Diario 8PM | `checkAdherencePatterns` | Revisa adherencia de últimos 3 días |
| Diario 7PM | `checkMissingMealLogs` | Detecta registros de comidas faltantes |
| Diario 6PM | `checkDailyHydration` | Verifica hidratación del día |
| Diario 10AM | `checkSleepPatterns` | Analiza patrones de sueño |
| Diario 7PM | `checkWorkoutCompletion` | Revisa entrenamientos pendientes |
| Diario 8PM | `checkActivityLevels` | Detecta sedentarismo |
| Diario 11PM | `checkStreaks` | Protege rachas en peligro |
| Diario 7AM | `sendWeatherBasedNotifications` | Notificaciones por clima |
| Diario 8AM | `sendSpecialDateNotifications` | Fechas especiales |

## 🎨 Tipos de Notificaciones

Cada notificación incluye:
- **Título**: Mensaje principal con emoji
- **Cuerpo**: Descripción detallada del problema/oportunidad
- **Acciones**: 2-3 botones de acción específicos
- **Tipo**: Categoría para analytics y filtrado
- **Prioridad**: `low`, `medium`, `high`
- **Metadata**: Datos adicionales para contexto

### Ejemplo de Notificación
```typescript
{
  title: "💧 ¡Necesitas más agua!",
  body: "Solo has tomado 800ml hoy. Tu objetivo son 2L. ¿Configuramos recordatorios?",
  actions: [
    { label: "Recordatorio cada 2h", action: "set_hydration_reminder" },
    { label: "Tracking Automático", action: "auto_tracking" },
    { label: "Consejos de Hidratación", action: "hydration_tips" }
  ],
  type: "hydration_low",
  priority: "medium"
}
```

## 🚀 Extensiones Futuras

### Integración con Push Notifications
- Firebase Cloud Messaging (FCM)
- Apple Push Notification Service (APNs)
- Scheduling inteligente por zona horaria

### Machine Learning Avanzado
- Modelos predictivos más sofisticados
- Personalización basada en comportamiento histórico
- A/B testing de mensajes de notificación

### Integración con Wearables
- Apple Health / Google Fit
- Fitbit, Garmin, etc.
- Datos en tiempo real para triggers más precisos

### Análisis de Sentimientos
- Procesamiento de texto en registros
- Detección automática de emociones
- Intervenciones proactivas de bienestar mental

## 📊 Métricas y Analytics

El sistema puede trackear:
- Tasa de apertura de notificaciones
- Acciones más utilizadas
- Efectividad por tipo de notificación
- Correlación entre notificaciones y retención
- Impacto en adherencia y progreso

## 🔒 Consideraciones de Privacidad

- Todas las notificaciones respetan configuraciones de privacidad
- Datos sensibles de salud se manejan con cuidado especial
- Opción de opt-out por tipo de notificación
- Cumplimiento con GDPR y regulaciones locales

---

Este sistema transforma una app básica de salud en un coach personal inteligente que acompaña al usuario 24/7 con insights relevantes y acciones específicas. 🎯