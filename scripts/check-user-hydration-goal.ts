import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserHydrationGoal() {
  console.log('🔍 Verificando objetivo de hidratación del usuario\n');

  try {
    const userId = 'cmj372o3l0030pr3ba9ytele7';
    
    // 1. Query directa para ver el hydrationGoal
    console.log('1. Verificando hydrationGoal en base de datos...');
    const result = await prisma.$queryRaw<Array<{ hydrationGoal: any }>>`
      SELECT "hydrationGoal" FROM "User" WHERE id = ${userId}
    `;

    console.log('📊 Resultado de la query:');
    console.log(JSON.stringify(result, null, 2));

    if (result[0]?.hydrationGoal) {
      console.log('\n✅ El usuario SÍ tiene hydrationGoal configurado:');
      const goal = result[0].hydrationGoal;
      console.log(`   • Objetivo diario: ${goal.dailyTargetMl}ml`);
      console.log(`   • Recordatorios: cada ${goal.reminderIntervalMinutes} minutos`);
      console.log(`   • Horario: ${goal.startTime} - ${goal.endTime}`);
      console.log(`   • Activo: ${goal.isActive ? 'Sí' : 'No'}`);
      console.log(`   • Usuario ID en goal: ${goal.userId}`);
      
      if (goal.createdAt) {
        console.log(`   • Creado: ${new Date(goal.createdAt).toLocaleString()}`);
      }
      if (goal.updatedAt) {
        console.log(`   • Actualizado: ${new Date(goal.updatedAt).toLocaleString()}`);
      }
    } else {
      console.log('\n❌ El usuario NO tiene hydrationGoal configurado');
    }

    // 2. Verificar si hay logs de hidratación
    console.log('\n2. Verificando logs de hidratación...');
    const hydrationLogs = await prisma.hydrationLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    console.log(`📊 Logs de hidratación encontrados: ${hydrationLogs.length}`);
    hydrationLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.date.toLocaleDateString()}: ${log.ml}ml`);
    });

    // 3. Verificar perfil del usuario
    console.log('\n3. Verificando perfil del usuario...');
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (profile) {
      console.log('📊 Perfil encontrado:');
      console.log(`   • Peso: ${profile.weightKg}kg`);
      console.log(`   • Altura: ${profile.heightCm}cm`);
      console.log(`   • Actividad: ${profile.activityLevel}`);
      console.log(`   • Sexo: ${profile.sex}`);
      console.log(`   • Objetivo nutricional: ${profile.nutritionGoal}`);
    } else {
      console.log('❌ No se encontró perfil');
    }

    // 4. Verificar cuándo se pudo haber creado
    console.log('\n4. Buscando en logs de la aplicación...');
    console.log('💡 Posibles causas del objetivo automático:');
    console.log('   • Se creó manualmente via API');
    console.log('   • Se creó via frontend');
    console.log('   • Migración de datos');
    console.log('   • Valor por defecto en algún proceso');

    // 5. Mostrar query para eliminar si es necesario
    console.log('\n5. Para eliminar el objetivo (si es necesario):');
    console.log(`   UPDATE "User" SET "hydrationGoal" = NULL WHERE id = '${userId}';`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
checkUserHydrationGoal().catch(console.error);