import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPushTokenModel() {
  try {
    console.log('🧪 Probando modelo UserPushToken...\n');

    // Verificar que el modelo existe
    console.log('1. Verificando que el modelo UserPushToken existe...');
    const count = await prisma.userPushToken.count();
    console.log(`✅ Modelo existe. Tokens actuales: ${count}\n`);

    // Buscar un usuario existente
    console.log('2. Buscando usuario existente...');
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No hay usuarios en la base de datos. Creando uno...');
      const newUser = await prisma.user.create({
        data: {
          email: 'test-push@example.com',
          password: 'hashedpassword',
        },
      });
      console.log(`✅ Usuario creado: ${newUser.id}`);
    } else {
      console.log(`✅ Usuario encontrado: ${user.id}`);
    }

    const userId = user?.id || (await prisma.user.findFirst())!.id;

    // Crear un token de prueba
    console.log('3. Creando token de prueba...');
    const testToken = await prisma.userPushToken.create({
      data: {
        userId: userId,
        pushToken: 'ExponentPushToken[test-token-123]',
        platform: 'ios',
      },
    });
    console.log(`✅ Token creado: ${testToken.id}\n`);

    // Buscar el token
    console.log('4. Buscando token...');
    const foundToken = await prisma.userPushToken.findUnique({
      where: { pushToken: 'ExponentPushToken[test-token-123]' },
    });
    console.log(`✅ Token encontrado: ${foundToken?.id}\n`);

    // Limpiar
    console.log('5. Limpiando token de prueba...');
    await prisma.userPushToken.delete({
      where: { id: testToken.id },
    });
    console.log('✅ Token eliminado\n');

    console.log('🎉 Modelo UserPushToken funciona correctamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPushTokenModel();