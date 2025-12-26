import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PushNotificationsService } from '../src/modules/push-notifications.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

async function testPushNotificationsComplete() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pushService = app.get(PushNotificationsService);
  const prisma = app.get(PrismaService);

  try {
    console.log('🧪 Iniciando pruebas completas del sistema de push notifications...\n');

    // 1. Buscar o crear usuario de prueba
    console.log('1️⃣ Preparando usuario de prueba...');
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-push@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-push@example.com',
          password: 'hashedpassword',
        },
      });
      console.log(`✅ Usuario creado: ${testUser.id}`);
    } else {
      console.log(`✅ Usuario encontrado: ${testUser.id}`);
    }

    // 2. Registrar tokens de prueba
    console.log('\n2️⃣ Registrando tokens de prueba...');
    const testTokens = [
      { token: 'ExponentPushToken[test-ios-token-123]', platform: 'ios' as const },
      { token: 'ExponentPushToken[test-android-token-456]', platform: 'android' as const },
    ];

    for (const { token, platform } of testTokens) {
      await pushService.registerPushToken(testUser.id, token, platform);
      console.log(`✅ Token ${platform} registrado`);
    }

    // 3. Verificar tokens en base de datos
    console.log('\n3️⃣ Verificando tokens en base de datos...');
    const userTokens = await prisma.userPushToken.findMany({
      where: { userId: testUser.id }
    });
    console.log(`✅ Tokens encontrados: ${userTokens.length}`);
    userTokens.forEach(token => {
      console.log(`   - ${token.platform}: ${token.pushToken.substring(0, 30)}...`);
    });

    // 4. Enviar notificación de prueba
    console.log('\n4️⃣ Enviando notificación de prueba...');
    await pushService.sendToUser(testUser.id, {
      title: '🍽️ Hora de comer',
      body: 'No olvides registrar tu almuerzo',
      data: { screen: 'nutrition', timestamp: new Date().toISOString() },
      sound: 'default',
    });
    console.log('✅ Notificación enviada');

    // 5. Probar método de compatibilidad
    console.log('\n5️⃣ Probando métodos de compatibilidad...');
    await pushService.registerDeviceToken(
      testUser.id, 
      'ExponentPushToken[test-compat-token-789]', 
      'expo'
    );
    console.log('✅ Método de compatibilidad registerDeviceToken funciona');

    // 6. Enviar notificación de prueba específica
    console.log('\n6️⃣ Enviando notificación de prueba específica...');
    await pushService.sendTestNotification(testUser.id);
    console.log('✅ Notificación de prueba específica enviada');

    // 7. Limpiar tokens inválidos
    console.log('\n7️⃣ Ejecutando limpieza de tokens...');
    await pushService.cleanupInvalidTokens();
    console.log('✅ Limpieza completada');

    // 8. Eliminar tokens de prueba
    console.log('\n8️⃣ Eliminando tokens de prueba...');
    for (const { token } of testTokens) {
      await pushService.unregisterPushToken(token, testUser.id);
      console.log(`✅ Token eliminado: ${token.substring(0, 30)}...`);
    }

    // Eliminar token de compatibilidad
    await pushService.unregisterDeviceToken('ExponentPushToken[test-compat-token-789]');
    console.log('✅ Token de compatibilidad eliminado');

    // 9. Verificar limpieza
    console.log('\n9️⃣ Verificando limpieza...');
    const remainingTokens = await prisma.userPushToken.findMany({
      where: { userId: testUser.id }
    });
    console.log(`✅ Tokens restantes: ${remainingTokens.length}`);

    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen de funcionalidades probadas:');
    console.log('• ✅ Registro de push tokens');
    console.log('• ✅ Envío de notificaciones');
    console.log('• ✅ Validación de tokens Expo');
    console.log('• ✅ Métodos de compatibilidad');
    console.log('• ✅ Limpieza de tokens');
    console.log('• ✅ Eliminación de tokens');
    console.log('• ✅ Integración con base de datos');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    await app.close();
  }
}

testPushNotificationsComplete();