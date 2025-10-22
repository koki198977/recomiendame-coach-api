# Endpoints para Eliminación de Cuenta de Usuario

## Descripción
Se han creado dos endpoints para eliminar cuentas de usuario con eliminación en cascada de todos los datos relacionados.

## Endpoints Disponibles

### 1. Auto-eliminación de cuenta (Usuario logueado)
```
DELETE /me/account
```
- **Autenticación**: JWT requerido
- **Permisos**: El usuario puede eliminar su propia cuenta
- **Body** (opcional):
```json
{
  "confirmation": "DELETE_ADMIN_ACCOUNT"  // Solo requerido para cuentas admin
}
```

### 2. Eliminación de cuenta por Admin
```
DELETE /users/:id
```
- **Autenticación**: JWT + Rol ADMIN requerido
- **Permisos**: Solo administradores
- **Parámetros**: `id` - ID del usuario a eliminar
- **Body** (opcional):
```json
{
  "confirmation": "DELETE_ADMIN_ACCOUNT"  // Solo requerido para eliminar cuentas admin
}
```

## Datos Eliminados en Cascada

Gracias a las configuraciones `onDelete: Cascade` en el schema de Prisma, se eliminan automáticamente:

- **Perfil de usuario** (UserProfile)
- **Preferencias**: alergias, condiciones médicas, preferencias culinarias
- **Posts y contenido social**: posts, likes, comentarios
- **Relaciones sociales**: seguidores, seguidos
- **Datos de gamificación**: puntos, logros, rachas
- **Planes y objetivos**: planes nutricionales, objetivos, check-ins
- **Logs de actividad**: hidratación, sueño, actividad física
- **Participación en retos**: membresías y progreso en challenges
- **Notificaciones y dispositivos**
- **Tokens de verificación y reset de contraseña**

## Seguridad

- Las cuentas de administrador requieren confirmación adicional
- Se usa transacción de base de datos para garantizar consistencia
- Verificación de existencia del usuario antes de eliminar
- Manejo de errores apropiado

## Ejemplos de Uso

### Usuario eliminando su propia cuenta:
```bash
curl -X DELETE http://localhost:3000/me/account \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin eliminando cuenta de usuario normal:
```bash
curl -X DELETE http://localhost:3000/users/user-id-here \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Admin eliminando cuenta de otro admin:
```bash
curl -X DELETE http://localhost:3000/users/admin-id-here \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmation": "DELETE_ADMIN_ACCOUNT"}'
```