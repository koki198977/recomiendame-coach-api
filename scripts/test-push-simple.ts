import { PrismaClient } from '@prisma/client';
import { PushNotificationsService } from '../src/modules/push-notifications.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

async function testPushSimple() {
  const prisma = new PrismaService();
  const pushService = new PushNotificationsService(prisma);

  try {
    console.log('🧪 Iniciando pruebas simples del sistema de push notifications...\n');

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

    // 2. Registrar token de prueba
    console.log('\n2️⃣ Registrando token de prueba...');
    const testToken = 'ExponentPushToken[test-token-simple-123]';
    
    await pushService.registerPushToken(testUser.id, testToken, 'ios');
    console.log('✅ Token registrado');

    // 3. Verificar token en base de datos
    console.log('\n3️⃣ Verificando token en base de datos...');
    const userTokens = await (prisma as any).userPushToken.findMany({
      where: { userId: testUser.id }
    });
    console.log(`✅ Tokens encontrados: ${userTokens.length}`);

    // 4. Enviar notificación de prueba
    console.log('\n4️⃣ Enviando notificación de prueba...');
    await pushService.sendTestNotification(testUser.id);
    console.log('✅ Notificación enviada (nota: puede fallar si el token no es real)');

    // 5. Limpiar
    console.log('\n5️⃣ Limpiando token de prueba...');
    await pushService.unregisterPushToken(testToken, testUser.id);
    console.log('✅ Token eliminado');

    console.log('\n🎉 Pruebas simples completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPushSimple();