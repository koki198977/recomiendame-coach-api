# 📱 Notificaciones sin Firebase - Polling System

## 🎯 **Para apps Android existentes sin push notifications**

Si no quieres configurar Firebase inmediatamente, puedes usar un sistema de polling que funciona muy bien:

### 📊 **Backend ya funciona 100%**
```bash
# Todas las notificaciones se crean automáticamente
GET /notifications?userId=123
# Respuesta:
{
  "notifications": [
    {
      "id": "notif_456",
      "title": "💧 ¡Necesitas más agua!",
      "body": "Solo has tomado 800ml hoy. Tu objetivo son 2L.",
      "read": false,
      "createdAt": "2024-12-16T18:00:00Z"
    },
    {
      "id": "notif_789", 
      "title": "📊 Tu adherencia ha bajado",
      "body": "Solo has seguido el 65% de tu plan esta semana.",
      "read": false,
      "createdAt": "2024-12-16T20:00:00Z"
    }
  ]
}
```

### 📱 **Implementación Android (Kotlin/Java)**

#### **1. Servicio de Notificaciones**
```kotlin
// NotificationService.kt
class NotificationService(private val apiService: ApiService) {
    
    suspend fun getUnreadNotifications(userId: String): List<Notification> {
        return try {
            val response = apiService.getNotifications(userId)
            response.notifications.filter { !it.read }
        } catch (e: Exception) {
            Log.e("NotificationService", "Error fetching notifications", e)
            emptyList()
        }
    }
    
    suspend fun markAsRead(notificationId: String, userId: String) {
        try {
            apiService.markNotificationAsRead(notificationId, userId)
        } catch (e: Exception) {
            Log.e("NotificationService", "Error marking as read", e)
        }
    }
}
```

#### **2. Worker para Polling en Background**
```kotlin
// NotificationWorker.kt
class NotificationWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val userId = getUserId() // Obtener del SharedPreferences
            if (userId.isNullOrEmpty()) return Result.success()
            
            val notificationService = NotificationService(ApiClient.instance)
            val unreadNotifications = notificationService.getUnreadNotifications(userId)
            
            // Mostrar notificaciones locales
            unreadNotifications.forEach { notification ->
                showLocalNotification(notification)
            }
            
            Result.success()
        } catch (e: Exception) {
            Log.e("NotificationWorker", "Error in background work", e)
            Result.retry()
        }
    }
    
    private fun showLocalNotification(notification: Notification) {
        val notificationManager = ContextCompat.getSystemService(
            applicationContext,
            NotificationManager::class.java
        ) as NotificationManager
        
        val notificationBuilder = NotificationCompat.Builder(applicationContext, "default")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(notification.title)
            .setContentText(notification.body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(createPendingIntent(notification))
        
        notificationManager.notify(notification.id.hashCode(), notificationBuilder.build())
    }
    
    private fun createPendingIntent(notification: Notification): PendingIntent {
        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            putExtra("notification_id", notification.id)
            putExtra("notification_type", notification.type)
        }
        
        return PendingIntent.getActivity(
            applicationContext,
            notification.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
```

#### **3. Configurar Polling Periódico**
```kotlin
// En tu Application class o MainActivity
class MyApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        setupNotificationPolling()
    }
    
    private fun setupNotificationPolling() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val notificationWork = PeriodicWorkRequestBuilder<NotificationWorker>(
            15, TimeUnit.MINUTES // Cada 15 minutos
        )
            .setConstraints(constraints)
            .build()
        
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "notification_polling",
            ExistingPeriodicWorkPolicy.KEEP,
            notificationWork
        )
    }
}
```

#### **4. Polling cuando la app está activa**
```kotlin
// En tu MainActivity o ViewModel
class MainViewModel : ViewModel() {
    private val notificationService = NotificationService(ApiClient.instance)
    private var pollingJob: Job? = null
    
    fun startActivePolling(userId: String) {
        pollingJob = viewModelScope.launch {
            while (isActive) {
                try {
                    val notifications = notificationService.getUnreadNotifications(userId)
                    _notifications.value = notifications
                    
                    // Mostrar badge si hay notificaciones no leídas
                    _unreadCount.value = notifications.size
                    
                } catch (e: Exception) {
                    Log.e("MainViewModel", "Error polling notifications", e)
                }
                
                delay(30_000) // Cada 30 segundos cuando la app está activa
            }
        }
    }
    
    fun stopActivePolling() {
        pollingJob?.cancel()
    }
}
```

### 📱 **React Native (sin Expo)**

#### **1. Servicio de Notificaciones**
```typescript
// NotificationService.ts
export class NotificationPollingService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isAppActive = true;

  async startPolling(userId: string, apiUrl: string) {
    this.stopPolling();
    
    const pollFrequency = this.isAppActive ? 30000 : 300000; // 30s activa, 5min background
    
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`${apiUrl}/notifications?userId=${userId}`);
        const data = await response.json();
        
        const unreadNotifications = data.notifications.filter(n => !n.read);
        
        if (unreadNotifications.length > 0) {
          this.handleNewNotifications(unreadNotifications);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, pollFrequency);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  setAppState(isActive: boolean) {
    this.isAppActive = isActive;
    // Reiniciar polling con nueva frecuencia
    if (this.pollingInterval) {
      // Restart with new frequency
    }
  }

  private handleNewNotifications(notifications: any[]) {
    // Mostrar notificaciones locales
    notifications.forEach(notification => {
      this.showLocalNotification(notification);
    });
    
    // Actualizar badge
    this.updateBadge(notifications.length);
  }

  private showLocalNotification(notification: any) {
    // Usar react-native-push-notification o similar
    PushNotification.localNotification({
      title: notification.title,
      message: notification.body,
      userInfo: { 
        notificationId: notification.id,
        type: notification.type 
      },
    });
  }
}
```

#### **2. Background Task (React Native)**
```typescript
// BackgroundTask.ts
import BackgroundJob from 'react-native-background-job';

export const startBackgroundNotificationPolling = (userId: string, apiUrl: string) => {
  BackgroundJob.start({
    jobKey: 'notification_polling',
    period: 300000, // 5 minutos
    requiredNetworkType: 'any',
  });

  BackgroundJob.on('notification_polling', async () => {
    try {
      const response = await fetch(`${apiUrl}/notifications?userId=${userId}`);
      const data = await response.json();
      
      const unreadNotifications = data.notifications.filter(n => !n.read);
      
      if (unreadNotifications.length > 0) {
        // Mostrar notificación local
        unreadNotifications.forEach(notification => {
          PushNotification.localNotification({
            title: notification.title,
            message: notification.body,
          });
        });
      }
    } catch (error) {
      console.error('Background polling error:', error);
    }
  });
};
```

## 🎯 **Ventajas del Sistema de Polling:**

### ✅ **Pros:**
- ✅ Funciona inmediatamente sin configuración adicional
- ✅ No depende de servicios externos (Firebase)
- ✅ Control total sobre la frecuencia
- ✅ Funciona en todas las plataformas
- ✅ Fácil de implementar y debuggear

### ⚠️ **Contras:**
- ⚠️ Consume más batería que push notifications
- ⚠️ Puede haber delay de hasta 15 minutos (configurable)
- ⚠️ No funciona si la app está completamente cerrada por mucho tiempo

## 📊 **Configuración Recomendada:**

```typescript
const POLLING_CONFIG = {
  // Cuando la app está activa
  foreground: 30000,    // 30 segundos
  
  // Cuando la app está en background
  background: 300000,   // 5 minutos
  
  // Cuando el dispositivo está en reposo
  idle: 900000,         // 15 minutos
};
```

## 🚀 **Migración Futura a Push Notifications:**

Cuando decidas implementar Firebase, solo necesitas:
1. Configurar Firebase
2. Registrar tokens de dispositivos  
3. El backend ya está listo para enviar push notifications
4. Mantener el polling como fallback

¡El sistema de polling te dará el 90% de la funcionalidad mientras decides si implementar push notifications! 📱✨