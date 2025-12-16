# 📱 Configuración Push Notifications - React Native + Expo

## 🚀 **Configuración del Backend (VPS + Docker)**

### 1. **Variables de Entorno (.env)**
```env
# Firebase (para push notifications)
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu-private-key-aqui\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@tu-proyecto.iam.gserviceaccount.com

# Expo (opcional, para mejor tracking)
EXPO_ACCESS_TOKEN=tu-expo-access-token

# Notificaciones
NOTIFICATIONS_ENABLED=true
CRON_JOBS_ENABLED=true
```

### 2. **Desplegar en VPS**
```bash
# En tu VPS
git pull origin main
docker-compose down
docker-compose up -d --build

# Verificar que funciona
docker-compose logs -f app
```

### 3. **Verificar Endpoints**
```bash
# Test básico
curl -X POST http://tu-vps:3001/notifications/demo \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123"}'

# Verificar notificaciones creadas
curl "http://tu-vps:3001/notifications?userId=test-user-123"
```

## 📱 **Configuración React Native + Expo**

### 1. **Instalar Dependencias**
```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2. **Configurar app.json/app.config.js**
```json
{
  "expo": {
    "name": "Tu App",
    "slug": "tu-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.tuempresa.tuapp"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.tuempresa.tuapp",
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "defaultChannel": "default"
        }
      ]
    ]
  }
}
```

### 3. **Crear Servicio de Notificaciones (React Native)**
```typescript
// services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<string | null> {
    try {
      // 1. Verificar que es un dispositivo físico
      if (!Device.isDevice) {
        console.warn('Las push notifications solo funcionan en dispositivos físicos');
        return null;
      }

      // 2. Solicitar permisos
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permisos de notificación denegados');
        return null;
      }

      // 3. Obtener token de Expo
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID no encontrado');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;
      console.log('📱 Expo Push Token:', this.expoPushToken);

      // 4. Configurar canal de notificación (Android)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error inicializando notificaciones:', error);
      return null;
    }
  }

  async registerWithBackend(userId: string, apiUrl: string): Promise<void> {
    if (!this.expoPushToken) {
      console.warn('No hay token de push disponible');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${userToken}`, // Si usas JWT
        },
        body: JSON.stringify({
          userId,
          token: this.expoPushToken,
          platform: 'expo',
        }),
      });

      if (response.ok) {
        console.log('✅ Token registrado en backend');
      } else {
        console.error('❌ Error registrando token:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error conectando con backend:', error);
    }
  }

  async unregisterFromBackend(apiUrl: string): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      await fetch(`${apiUrl}/notifications/unregister-token`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.expoPushToken,
        }),
      });

      console.log('✅ Token eliminado del backend');
    } catch (error) {
      console.error('❌ Error eliminando token:', error);
    }
  }

  setupNotificationListeners() {
    // Listener para cuando la app está en foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notificación recibida (foreground):', notification);
      
      // Aquí puedes mostrar un modal, actualizar estado, etc.
      this.handleNotificationReceived(notification);
    });

    // Listener para cuando el usuario toca la notificación
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó notificación:', response);
      
      // Navegar a pantalla específica basada en el tipo
      this.handleNotificationTapped(response);
    });

    return {
      foregroundSubscription,
      responseSubscription,
    };
  }

  private handleNotificationReceived(notification: Notifications.Notification) {
    const { title, body, data } = notification.request.content;
    
    // Mostrar notificación local si la app está activa
    // O actualizar badge, estado global, etc.
    
    console.log('Datos de notificación:', data);
  }

  private handleNotificationTapped(response: Notifications.NotificationResponse) {
    const { data } = response.notification.request.content;
    
    if (data?.type) {
      // Navegar basado en el tipo de notificación
      switch (data.type) {
        case 'hydration_low':
          // Navegar a pantalla de hidratación
          // navigation.navigate('Hydration');
          break;
        case 'meal_log_missing':
          // Navegar a registro de comidas
          // navigation.navigate('LogMeal');
          break;
        case 'workout_incomplete':
          // Navegar a entrenamientos
          // navigation.navigate('Workouts');
          break;
        default:
          // Navegar a pantalla de notificaciones
          // navigation.navigate('Notifications');
      }
    }

    // Procesar acciones si las hay
    if (data?.actions) {
      try {
        const actions = JSON.parse(data.actions);
        console.log('Acciones disponibles:', actions);
        // Mostrar modal con acciones o ejecutar acción por defecto
      } catch (error) {
        console.error('Error parseando acciones:', error);
      }
    }
  }

  async testNotification(userId: string, apiUrl: string): Promise<void> {
    try {
      const response = await fetch(`${apiUrl}/notifications/test-push/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Notificación de prueba enviada');
      } else {
        console.error('❌ Error enviando notificación de prueba');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }
}
```

### 4. **Integrar en tu App Principal**
```typescript
// App.tsx o donde manejes la autenticación
import { useEffect } from 'react';
import { NotificationService } from './services/NotificationService';

const API_URL = 'https://api-coach.recomiendameapp.cl'; // Tu VPS

export default function App() {
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    const notificationService = NotificationService.getInstance();
    
    // 1. Inicializar servicio
    const token = await notificationService.initialize();
    
    if (token) {
      // 2. Configurar listeners
      const subscriptions = notificationService.setupNotificationListeners();
      
      // 3. Registrar con backend (cuando el usuario haga login)
      // await notificationService.registerWithBackend(userId, API_URL);
      
      // Cleanup
      return () => {
        subscriptions.foregroundSubscription.remove();
        subscriptions.responseSubscription.remove();
      };
    }
  };

  // Cuando el usuario haga login
  const handleLogin = async (userId: string) => {
    const notificationService = NotificationService.getInstance();
    await notificationService.registerWithBackend(userId, API_URL);
  };

  // Cuando el usuario haga logout
  const handleLogout = async () => {
    const notificationService = NotificationService.getInstance();
    await notificationService.unregisterFromBackend(API_URL);
  };

  return (
    // Tu app aquí
  );
}
```

### 5. **Probar el Sistema Completo**

#### **Paso 1: Registrar token**
```typescript
// En tu pantalla de login después de autenticar
const userId = 'user-123';
const notificationService = NotificationService.getInstance();
await notificationService.registerWithBackend(userId, API_URL);
```

#### **Paso 2: Trigger una notificación desde el backend**
```bash
# Registrar una comida alta en carbohidratos (si el usuario tiene diabetes)
curl -X POST https://api-coach.recomiendameapp.cl/meals/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-jwt-token" \
  -d '{
    "title": "Pizza grande",
    "slot": "DINNER",
    "kcal": 800,
    "protein_g": 30,
    "carbs_g": 90,
    "fat_g": 35
  }'
```

#### **Paso 3: Verificar que llegó la notificación**
- Deberías recibir: "🩺 Recordatorio para tu diabetes"
- Al tocarla, debería navegar a la pantalla correspondiente

## 🔧 **Configuración Firebase (Opcional pero Recomendado)**

### 1. **Crear Proyecto Firebase**
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto
3. Habilitar Cloud Messaging

### 2. **Configurar Android**
1. Agregar app Android con tu package name
2. Descargar `google-services.json`
3. Colocar en la raíz de tu proyecto Expo

### 3. **Configurar iOS**
1. Agregar app iOS con tu bundle identifier
2. Descargar `GoogleService-Info.plist`
3. Colocar en la raíz de tu proyecto Expo

### 4. **Obtener Credenciales del Servidor**
1. Project Settings → Service Accounts
2. Generate new private key
3. Usar esas credenciales en tu backend

## 🎯 **Flujo Completo de Funcionamiento**

```
1. Usuario abre la app → Se registra token de Expo
2. Usuario hace login → Token se asocia al userId en backend
3. Usuario registra comida → Backend analiza y crea notificación
4. Backend envía push notification → Usuario recibe notificación
5. Usuario toca notificación → App navega a pantalla específica
6. Usuario ejecuta acción → Se actualiza estado en backend
```

## 🐛 **Troubleshooting**

### **No recibo notificaciones**
1. Verificar que el token se registró: `GET /notifications?userId=123`
2. Verificar logs del backend: `docker-compose logs -f app`
3. Probar notificación manual: `POST /notifications/test-push/123`

### **Notificaciones no aparecen en iOS**
1. Verificar permisos en Configuración → Tu App → Notificaciones
2. Asegurarte de que `GoogleService-Info.plist` esté en el proyecto
3. Verificar que el bundle identifier coincida

### **Error en Android**
1. Verificar que `google-services.json` esté en el proyecto
2. Verificar que el package name coincida
3. Limpiar caché: `npx expo start -c`

¡Con esta configuración tendrás un sistema completo de notificaciones push funcionando 24/7! 🚀