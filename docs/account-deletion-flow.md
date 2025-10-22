# Flujo de Eliminación de Cuenta por Email

## Descripción
Sistema completo para que los usuarios puedan eliminar su cuenta mediante confirmación por email, ideal para cumplir con requisitos de Android y políticas de privacidad.

## Flujo del Proceso

1. **Usuario solicita eliminación** → Envía email con token
2. **Usuario recibe email** → Hace clic en enlace de confirmación  
3. **Usuario confirma** → Cuenta eliminada permanentemente
4. **Confirmación final** → Email de confirmación de eliminación

## Endpoints Disponibles

### 1. Solicitar eliminación de cuenta
```
POST /auth/request-account-deletion
```

**Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Se ha enviado un enlace de confirmación a tu email. El enlace expira en 24 horas."
}
```

### 2. Confirmar eliminación (GET - para enlaces de email)
```
GET /auth/confirm-account-deletion?token=TOKEN_AQUI
```

### 3. Confirmar eliminación (POST - para apps)
```
POST /auth/confirm-account-deletion
```

**Body:**
```json
{
  "token": "TOKEN_DEL_EMAIL"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir."
}
```

## Comandos cURL para Testing

### 1. Solicitar eliminación de cuenta
```bash
curl -X POST http://localhost:3000/auth/request-account-deletion \
  -H "Content-Type: application/json" \
  -d '{"email": "test@ejemplo.com"}'
```

**Respuesta esperada:**
```json
{
  "message": "Se ha enviado un enlace de confirmación a tu email. El enlace expira en 24 horas."
}
```

### 2. Confirmar eliminación (método POST - para apps)
```bash
curl -X POST http://localhost:3000/auth/confirm-account-deletion \
  -H "Content-Type: application/json" \
  -d '{"token": "TOKEN_DEL_EMAIL_AQUI"}'
```

**Respuesta esperada:**
```json
{
  "message": "Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir."
}
```

### 3. Confirmar eliminación (método GET - simula clic en email)
```bash
curl -X GET "http://localhost:3000/auth/confirm-account-deletion?token=TOKEN_DEL_EMAIL_AQUI"
```

**Respuesta esperada:**
```json
{
  "message": "Tu cuenta ha sido eliminada exitosamente. Lamentamos verte partir."
}
```

### 4. Ver página de confirmación (sin token)
```bash
curl -X GET "http://localhost:3000/auth/confirm-account-deletion"
```

**Respuesta:** Página HTML de confirmación

## Configuración Requerida

### Variables de Entorno
Asegúrate de tener configuradas estas variables en tu `.env`:

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu-email@gmail.com
MAIL_PASS=tu-app-password
MAIL_FROM="Recomiéndame <no-reply@recomiendameapp.cl>"

# Frontend URL (para enlaces en emails)
FRONTEND_URL=http://localhost:3000
```

### Base de Datos
La migración ya fue aplicada. El modelo `AccountDeletion` incluye:
- `id`: Identificador único
- `userId`: ID del usuario
- `tokenHash`: Hash del token de confirmación
- `requestedAt`: Fecha de solicitud
- `expiresAt`: Fecha de expiración (24 horas)
- `usedAt`: Fecha de uso (null si no se ha usado)

## Características de Seguridad

- **Tokens únicos**: Cada solicitud genera un token único
- **Expiración**: Los tokens expiran en 24 horas
- **Un solo uso**: Los tokens no pueden reutilizarse
- **Hash seguro**: Los tokens se almacenan hasheados
- **Limpieza automática**: Se eliminan tokens anteriores del usuario
- **Transacciones**: Eliminación atómica para consistencia

## Emails Enviados

### 1. Email de confirmación de eliminación
- **Template**: `account-deletion.hbs`
- **Incluye**: Enlace de confirmación, advertencias, tiempo de expiración
- **Estilo**: Diseño responsivo con advertencias claras

### 2. Email de confirmación final
- **Template**: `account-deleted.hbs`  
- **Incluye**: Confirmación de eliminación, detalles, despedida
- **Estilo**: Diseño limpio y profesional

## Página de Confirmación Web

Se incluye una página HTML (`public/confirm-account-deletion.html`) que:
- Muestra advertencias claras sobre la eliminación
- Permite confirmar o cancelar la acción
- Maneja la respuesta del servidor
- Proporciona feedback visual (loading, success, error)

## Datos Eliminados en Cascada

Al confirmar la eliminación se eliminan automáticamente:
- Perfil de usuario y datos personales
- Posts, likes, comentarios y contenido social
- Relaciones sociales (seguidores, seguidos)
- Planes nutricionales y objetivos
- Check-ins y logs de progreso
- Puntos, logros y gamificación
- Notificaciones y dispositivos
- Tokens de verificación y reset
- Participación en challenges

## Integración con Android

Para Android, puedes usar el endpoint POST:

```kotlin
// Solicitar eliminación
val response = apiService.requestAccountDeletion(
    RequestAccountDeletionDto(email = userEmail)
)

// El usuario recibe email y obtiene el token
// Luego confirmar eliminación
val confirmResponse = apiService.confirmAccountDeletion(
    ConfirmAccountDeletionDto(token = tokenFromEmail)
)
```

## Testing Completo

1. **Crear usuario de prueba**
2. **Solicitar eliminación** con curl
3. **Revisar email** recibido
4. **Extraer token** del enlace del email
5. **Confirmar eliminación** con curl usando el token
6. **Verificar** que el usuario ya no existe en la base de datos

El sistema está listo para producción y cumple con los estándares de seguridad y privacidad requeridos.