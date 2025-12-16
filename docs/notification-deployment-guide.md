# 🚀 Guía de Despliegue - Sistema de Notificaciones

## ¿Cómo Funciona Realmente?

### 🤖 **Automático (Cron Jobs)**
Una vez desplegado, estos triggers se ejecutan solos:

```typescript
// ⏰ AUTOMÁTICOS - No necesitas hacer nada
@Cron(CronExpression.EVERY_DAY_AT_8PM)   // 8:00 PM todos los días
@Cron(CronExpression.EVERY_DAY_AT_7AM)   // 7:00 AM todos los días
@Cron(CronExpression.EVERY_DAY_AT_6PM)   // 6:00 PM todos los días
```

### 🎯 **Manual (Eventos en Tiempo Real)**
Estos se activan cuando el usuario hace algo:

```typescript
// 🔥 EN TIEMPO REAL - Cuando el usuario actúa
// Ejemplo: Usuario registra una comida
app.post('/meals', async (req, res) => {
  // 1. Guardar la comida
  const meal = await saveMeal(req.body);
  
  // 2. Trigger inmediato de notificaciones
  await notificationTriggers.checkNutritionalBalance(userId);
  await healthAwareService.checkHealthConditionCompliance(userId);
  
  res.json(meal);
});
```

## 📋 **Pasos para Activar Completamente**

### 1. **Desplegar el Código**
```bash
# En tu VPS
git pull origin main
npm install
npm run build
pm2 restart your-app
```

### 2. **Integrar Triggers en Endpoints Existentes**

Necesitas agregar los triggers a tus endpoints actuales:

#### **En tu endpoint de comidas:**
```typescript
// src/modules/meals.controller.ts
@Post()
async createMeal(@Body() mealData: any, @Request() req: any) {
  const meal = await this.mealsService.create(mealData);
  
  // 🔔 TRIGGER INMEDIATO
  await this.notificationTriggers.checkNutritionalBalance(req.user.id);
  await this.healthAwareService.checkHealthConditionCompliance(req.user.id);
  
  return meal;
}
```

#### **En tu endpoint de check-ins:**
```typescript
// src/modules/checkins.controller.ts
@Post()
async createCheckin(@Body() checkinData: any, @Request() req: any) {
  const checkin = await this.checkinsService.create(checkinData);
  
  // 🔔 TRIGGERS INMEDIATOS
  await this.notificationTriggers.checkGoalProgress(req.user.id);
  await this.smartAnalytics.analyzeUserPatterns(req.user.id);
  
  return checkin;
}
```

#### **En tu endpoint de sueño:**
```typescript
// src/modules/sleep.controller.ts (si tienes)
@Post()
async logSleep(@Body() sleepData: any, @Request() req: any) {
  const sleep = await this.sleepService.create(sleepData);
  
  // 🔔 TRIGGER INMEDIATO
  await this.notificationTriggers.triggerNotification(req.user.id, 'sleep_patterns');
  
  return sleep;
}
```

### 3. **Configurar Push Notifications (Opcional pero Recomendado)**

#### **Instalar Firebase Admin SDK:**
```bash
npm install firebase-admin
```

#### **Configurar en notifications.service.ts:**
```typescript
import * as admin from 'firebase-admin';

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

private async sendPushNotification(userId: string, notification: SmartNotification) {
  const devices = await this.prisma.deviceToken.findMany({
    where: { userId },
  });

  for (const device of devices) {
    await admin.messaging().send({
      token: device.token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        type: notification.type,
        actions: JSON.stringify(notification.actions),
      },
    });
  }
}
```

### 4. **Variables de Entorno**
```env
# .env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# APIs opcionales
WEATHER_API_KEY=your-openweather-key
```

## 🔄 **Flujo Completo de Funcionamiento**

### **Escenario 1: Usuario Registra Comida Alta en Carbohidratos**
```
1. Usuario POST /meals { title: "Pizza", carbs_g: 80 }
2. Se guarda en base de datos
3. Se ejecuta checkHealthConditionCompliance(userId)
4. Detecta: usuario tiene diabetes + comida alta en carbos
5. Se crea notificación en BD
6. Se envía push notification al dispositivo
7. Usuario recibe: "🩺 Recordatorio para tu diabetes"
```

### **Escenario 2: Cron Job Diario**
```
1. 8:00 PM - Se ejecuta checkAdherencePatterns()
2. Revisa TODOS los usuarios automáticamente
3. Encuentra usuarios con adherencia < 70%
4. Crea notificaciones para esos usuarios
5. Envía push notifications
6. Usuarios reciben: "📊 Tu adherencia ha bajado"
```

## 📱 **Integración con Frontend**

### **Endpoint para obtener notificaciones:**
```typescript
// GET /notifications?userId=123
{
  "notifications": [
    {
      "id": "notif_123",
      "title": "💧 ¡Necesitas más agua!",
      "body": "Solo has tomado 800ml hoy...",
      "read": false,
      "createdAt": "2024-12-16T20:00:00Z",
      "actions": [
        { "label": "Recordatorio cada 2h", "action": "set_hydration_reminder" },
        { "label": "Tracking Automático", "action": "auto_tracking" }
      ]
    }
  ]
}
```

### **Manejar acciones en el frontend:**
```typescript
// Cuando usuario toca una acción
const handleNotificationAction = (action: string, notificationId: string) => {
  switch(action) {
    case 'set_hydration_reminder':
      // Configurar recordatorio cada 2h
      setHydrationReminder(2 * 60 * 60 * 1000);
      break;
    case 'log_meal':
      // Navegar a pantalla de registro de comida
      navigation.navigate('LogMeal');
      break;
    case 'start_workout':
      // Iniciar entrenamiento
      navigation.navigate('Workout');
      break;
  }
  
  // Marcar como leída
  markNotificationAsRead(notificationId);
};
```

## ⚡ **Activación Inmediata vs Programada**

### **Inmediata (Cuando usuario actúa):**
- ✅ Registro de comida → Check nutricional inmediato
- ✅ Check-in de peso → Análisis de progreso inmediato  
- ✅ Log de sueño → Análisis de patrones inmediato
- ✅ Completar entrenamiento → Check de sobreentrenamiento

### **Programada (Cron jobs):**
- ⏰ 7:00 AM → Notificaciones de clima y motivación matutina
- ⏰ 6:00 PM → Check de hidratación diaria
- ⏰ 8:00 PM → Análisis de adherencia y actividad
- ⏰ 11:00 PM → Protección de rachas

## 🎯 **Resultado Final**

Una vez desplegado y configurado:

1. **Los cron jobs funcionan solos** - No necesitas hacer nada
2. **Los triggers manuales se activan** - Cuando integres en tus endpoints
3. **Los usuarios reciben notificaciones inteligentes** - En tiempo real y programadas
4. **El sistema aprende y mejora** - Detecta patrones automáticamente

¡Es como tener un coach personal 24/7 para cada usuario! 🤖💪