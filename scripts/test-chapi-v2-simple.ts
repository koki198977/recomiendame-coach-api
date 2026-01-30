import { PrismaClient } from '@prisma/client';

async function testChapiV2Simple() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Prueba simple de Chapi 2.0...\n');

    // Verificar que podemos conectar a la base de datos
    const userCount = await prisma.user.count();
    console.log(`✅ Conexión a BD exitosa. Usuarios en sistema: ${userCount}\n`);

    // Buscar un usuario de prueba
    const testUser = await prisma.user.findFirst({
      where: { email: { contains: '@' } },
      include: {
        profile: true,
        allergies: { include: { allergy: true } },
        conditions: { include: { condition: true } },
        checkins: { take: 5, orderBy: { date: 'desc' } },
        hydrationLogs: { take: 5, orderBy: { date: 'desc' } },
        sleepLogs: { take: 5, orderBy: { date: 'desc' } },
        emotionalLogs: { take: 5, orderBy: { date: 'desc' } },
      },
    });

    if (!testUser) {
      console.log('❌ No se encontró ningún usuario para pruebas');
      return;
    }

    console.log(`👤 Usuario de prueba encontrado: ${testUser.email}`);
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Perfil: ${testUser.profile ? '✅' : '❌'}`);
    console.log(`   Alergias: ${testUser.allergies.length}`);
    console.log(`   Condiciones: ${testUser.conditions.length}`);
    console.log(`   Check-ins recientes: ${testUser.checkins.length}`);
    console.log(`   Logs de hidratación: ${testUser.hydrationLogs.length}`);
    console.log(`   Logs de sueño: ${testUser.sleepLogs.length}`);
    console.log(`   Logs emocionales: ${testUser.emotionalLogs.length}\n`);

    // Simular datos que tendría Chapi 2.0
    const mockUserProfile = {
      id: testUser.id,
      email: testUser.email,
      profile: {
        sex: testUser.profile?.sex || 'UNSPECIFIED',
        age: testUser.profile?.birthDate 
          ? Math.floor((Date.now() - testUser.profile.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0,
        heightCm: testUser.profile?.heightCm || 0,
        weightKg: Number(testUser.profile?.weightKg) || 0,
        activityLevel: testUser.profile?.activityLevel || 'MODERATE',
        nutritionGoal: testUser.profile?.nutritionGoal || 'IMPROVE_HEALTH',
        targetWeightKg: Number(testUser.profile?.targetWeightKg) || 0,
      },
      allergies: testUser.allergies.map(a => a.allergy.name),
      conditions: testUser.conditions.map(c => c.condition.label),
      recentData: {
        checkins: testUser.checkins.length,
        hydration: testUser.hydrationLogs.length,
        sleep: testUser.sleepLogs.length,
        emotions: testUser.emotionalLogs.length,
      },
    };

    console.log('📊 Perfil completo simulado para Chapi 2.0:');
    console.log(`   Edad: ${mockUserProfile.profile.age} años`);
    console.log(`   Peso actual: ${mockUserProfile.profile.weightKg}kg`);
    console.log(`   Objetivo: ${mockUserProfile.profile.nutritionGoal}`);
    console.log(`   Alergias: ${mockUserProfile.allergies.join(', ') || 'Ninguna'}`);
    console.log(`   Condiciones: ${mockUserProfile.conditions.join(', ') || 'Ninguna'}`);
    console.log(`   Datos recientes disponibles:`);
    console.log(`     - Check-ins: ${mockUserProfile.recentData.checkins}`);
    console.log(`     - Hidratación: ${mockUserProfile.recentData.hydration}`);
    console.log(`     - Sueño: ${mockUserProfile.recentData.sleep}`);
    console.log(`     - Emociones: ${mockUserProfile.recentData.emotions}\n`);

    // Simular respuesta de Chapi 2.0
    const mockChapiResponse = {
      message: `¡Hola ${testUser.email.split('@')[0]}! He revisado tu perfil y veo que ${
        mockUserProfile.profile.nutritionGoal === 'LOSE_WEIGHT' ? 'quieres perder peso' :
        mockUserProfile.profile.nutritionGoal === 'GAIN_WEIGHT' ? 'quieres ganar peso' :
        mockUserProfile.profile.nutritionGoal === 'GAIN_MUSCLE' ? 'quieres ganar músculo' :
        'quieres mejorar tu salud'
      }. ${
        mockUserProfile.recentData.checkins > 0 
          ? `He notado que has estado haciendo check-ins regularmente (${mockUserProfile.recentData.checkins} recientes), ¡excelente consistencia!` 
          : 'Te recomiendo empezar con check-ins diarios para hacer seguimiento de tu progreso.'
      } ${
        mockUserProfile.allergies.length > 0 
          ? `También tengo en cuenta tus alergias a ${mockUserProfile.allergies.join(', ')}.` 
          : ''
      } ¿En qué puedo ayudarte hoy?`,
      messageType: 'conversational',
      personalizedInsights: {
        basedOnHistory: [
          `Usuario con objetivo de ${mockUserProfile.profile.nutritionGoal}`,
          `${mockUserProfile.recentData.checkins} check-ins recientes`,
          `${mockUserProfile.allergies.length} alergias registradas`,
        ],
        predictiveAnalysis: mockUserProfile.recentData.checkins > 2 
          ? 'Usuario comprometido con seguimiento regular'
          : 'Usuario podría beneficiarse de más estructura',
        recommendations: [
          {
            type: 'daily_checkin',
            title: 'Check-in diario',
            description: 'Mantén tu rutina de seguimiento diario',
            priority: 'high',
          },
        ],
      },
      followUpSuggestions: [
        '¿Cómo te sientes hoy?',
        '¿Quieres revisar tu progreso?',
        '¿Necesitas ayuda con tu plan?',
      ],
    };

    console.log('🤖 Respuesta simulada de Chapi 2.0:');
    console.log(`   Mensaje: ${mockChapiResponse.message}`);
    console.log(`   Tipo: ${mockChapiResponse.messageType}`);
    console.log(`   Insights personalizados:`);
    mockChapiResponse.personalizedInsights.basedOnHistory.forEach(insight => {
      console.log(`     - ${insight}`);
    });
    console.log(`   Análisis predictivo: ${mockChapiResponse.personalizedInsights.predictiveAnalysis}`);
    console.log(`   Sugerencias de seguimiento:`);
    mockChapiResponse.followUpSuggestions.forEach(suggestion => {
      console.log(`     - ${suggestion}`);
    });
    console.log();

    console.log('🎉 ¡Prueba simple completada exitosamente!');
    console.log('\n📋 Funcionalidades que implementará Chapi 2.0:');
    console.log('   ✅ Acceso completo al perfil del usuario');
    console.log('   ✅ Análisis de datos históricos');
    console.log('   ✅ Respuestas personalizadas basadas en contexto');
    console.log('   ✅ Insights predictivos');
    console.log('   ✅ Memoria conversacional');
    console.log('   ✅ Recomendaciones específicas por usuario');
    console.log('\n🚀 Para activar completamente:');
    console.log('   1. Ejecutar migración de base de datos');
    console.log('   2. Configurar OpenAI API key');
    console.log('   3. Probar endpoints de la API');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testChapiV2Simple().catch(console.error);
}

export { testChapiV2Simple };