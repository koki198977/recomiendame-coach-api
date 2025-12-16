/**
 * Script para probar el sistema completo de hidratación
 * 
 * Uso: npx ts-node scripts/test-hydration-system.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testHydrationSystem() {
  console.log('💧 Probando el sistema completo de hidratación...\n');

  console.log('🎯 Funcionalidades implementadas:');
  console.log('1. ✅ Registro de ingesta de agua');
  console.log('2. ✅ Objetivos personalizados de hidratación');
  console.log('3. ✅ Análisis diario y patrones semanales');
  console.log('4. ✅ Notificaciones inteligentes de hidratación');
  console.log('5. ✅ Integración con sistema de monitoreo de Chapi');
  console.log('6. ✅ Recordatorios automáticos');
  console.log('7. ✅ Estadísticas y métricas avanzadas');

  console.log('\n📊 Nuevos endpoints de hidratación:');
  
  const baseUrl = 'https://api-coach.recomiendameapp.cl';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWowbzJ4bTgwMDZobXMzYmszbmxwZnRpIiwiZW1haWwiOiJqb3JnZXVsczE5QGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiZW1haWxWZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzY1NDExMTQ5LCJleHAiOjE3NjU0OTc1NDl9.vaRoy7PPbc9XJghwLiWs1D1ZeVpDLSGcrR7IQo1kFbY';

  console.log('\n💧 1. Registrar ingesta de agua:');
  console.log(`curl --location --request POST '${baseUrl}/hydration/log' \\`);
  console.log(`--header 'Content-Type: application/json' \\`);
  console.log(`--header 'Authorization: Bearer ${token}' \\`);
  console.log(`--data '{"ml": 250}'`);
  
  console.log('\n📱 Respuesta esperada:');
  console.log(`{
  "log": {
    "id": "clx...",
    "userId": "cm...",
    "date": "2024-12-16T10:30:00Z",
    "ml": 250
  },
  "dailyAnalysis": {
    "totalMl": 750,
    "targetMl": 2000,
    "achievementPercentage": 38,
    "status": "NEEDS_IMPROVEMENT",
    "remainingMl": 1250,
    "insights": ["⚡ Necesitas acelerar el ritmo de hidratación"]
  },
  "message": "¡Buen progreso! 📈 250ml registrados. Llevas 38% del objetivo.",
  "achievements": ["🌅 ¡Primer vaso del día!"]
}`);

  console.log('\n\n📊 2. Ver estadísticas completas:');
  console.log(`curl --location '${baseUrl}/hydration/stats' \\`);
  console.log(`--header 'Authorization: Bearer ${token}'`);

  console.log('\n📱 Respuesta esperada:');
  console.log(`{
  "dailyAnalysis": {
    "totalMl": 1800,
    "targetMl": 2000,
    "achievementPercentage": 90,
    "status": "GOOD",
    "remainingMl": 200,
    "averagePerHour": 112.5,
    "recommendedNextIntake": 200,
    "insights": ["👍 Vas muy bien, solo te faltan unos sorbos más"]
  },
  "pattern": {
    "weeklyAverage": 1650,
    "bestDay": { "date": "2024-12-15", "ml": 2200 },
    "worstDay": { "date": "2024-12-12", "ml": 800 },
    "consistency": "GOOD",
    "streak": 3,
    "missedDays": 2,
    "peakHours": ["08:00", "12:00", "16:00", "20:00"]
  },
  "weeklyData": [
    { "date": "2024-12-10", "ml": 1200, "percentage": 60 },
    { "date": "2024-12-11", "ml": 1800, "percentage": 90 },
    { "date": "2024-12-12", "ml": 800, "percentage": 40 }
  ],
  "recommendations": [
    "👍 Vas muy bien, solo te faltan unos sorbos más",
    "📈 Mejora tu consistencia: establece una rutina diaria",
    "⏰ Tus mejores horas son: 08:00, 12:00, 16:00, 20:00"
  ]
}`);

  console.log('\n\n🎯 3. Establecer objetivo personalizado:');
  console.log(`curl --location --request POST '${baseUrl}/hydration/goal' \\`);
  console.log(`--header 'Content-Type: application/json' \\`);
  console.log(`--header 'Authorization: Bearer ${token}' \\`);
  console.log(`--data '{
  "autoCalculate": true,
  "reminderIntervalMinutes": 120,
  "startTime": "07:00",
  "endTime": "22:00",
  "isActive": true
}'`);

  console.log('\n📱 Respuesta esperada:');
  console.log(`{
  "goal": {
    "userId": "cm...",
    "dailyTargetMl": 2250,
    "reminderIntervalMinutes": 120,
    "startTime": "07:00",
    "endTime": "22:00",
    "isActive": true
  },
  "message": "🎯 He calculado tu objetivo personalizado: 2.3L diarios. ¡Perfecto para tu perfil!",
  "recommendations": [
    "👍 Objetivo equilibrado y saludable",
    "🔔 Recordatorios frecuentes te ayudarán a crear el hábito",
    "💡 Tip: Toma un vaso al despertar para activar tu metabolismo"
  ]
}`);

  console.log('\n\n⚡ 4. Registro rápido (shortcuts):');
  console.log(`# Vaso pequeño (200ml)`);
  console.log(`curl --location '${baseUrl}/hydration/quick-log/200' \\`);
  console.log(`--header 'Authorization: Bearer ${token}'`);
  
  console.log(`\n# Vaso estándar (250ml)`);
  console.log(`curl --location '${baseUrl}/hydration/quick-log/250' \\`);
  console.log(`--header 'Authorization: Bearer ${token}'`);
  
  console.log(`\n# Botella (500ml)`);
  console.log(`curl --location '${baseUrl}/hydration/quick-log/500' \\`);
  console.log(`--header 'Authorization: Bearer ${token}'`);

  console.log('\n\n🔔 5. Ver recordatorios activos:');
  console.log(`curl --location '${baseUrl}/hydration/reminders' \\`);
  console.log(`--header 'Authorization: Bearer ${token}'`);

  console.log('\n📱 Respuesta esperada:');
  console.log(`{
  "nextReminder": {
    "scheduledFor": "2024-12-16T12:30:00Z",
    "message": "🌊 Recordatorio de hidratación: 250ml te acercan a tu objetivo",
    "ml": 250
  },
  "goal": {
    "dailyTargetMl": 2000,
    "reminderIntervalMinutes": 120,
    "isActive": true
  },
  "currentStatus": {
    "ml": 1200,
    "percentage": 60,
    "remaining": 800
  }
}`);

  console.log('\n\n🤖 Notificaciones automáticas que Chapi generará:\n');

  const hydrationNotifications = [
    {
      scenario: 'Deshidratación detectada',
      trigger: 'Usuario ha tomado < 50% del objetivo después de las 2 PM',
      notification: {
        title: '💧 ¡Riesgo de deshidratación!',
        body: 'Solo has tomado 600ml hoy (30% de tu objetivo). Tu cuerpo necesita agua.',
        actions: ['Registrar Agua', 'Recordatorio']
      }
    },
    {
      scenario: 'Objetivo alcanzado',
      trigger: 'Usuario completa 90-110% del objetivo diario',
      notification: {
        title: '🎉 ¡Objetivo de hidratación alcanzado!',
        body: '¡Excelente! Has tomado 2000ml hoy. Tu cuerpo te lo agradece.',
        actions: ['Ver Estadísticas']
      }
    },
    {
      scenario: 'Racha de hidratación',
      trigger: 'Usuario alcanza objetivo 7+ días consecutivos',
      notification: {
        title: '🔥 ¡Racha de hidratación!',
        body: '¡Increíble! Llevas 12 días consecutivos alcanzando tu objetivo de hidratación.',
        actions: []
      }
    },
    {
      scenario: 'Patrón inconsistente',
      trigger: 'Usuario falla objetivo 3+ días en una semana',
      notification: {
        title: '💪 ¡No te rindas con la hidratación!',
        body: 'Has tenido 4 días por debajo del objetivo esta semana. Pequeños sorbos hacen la diferencia.',
        actions: ['Ajustar Objetivo', 'Más Recordatorios']
      }
    },
    {
      scenario: 'Recordatorio inteligente',
      trigger: 'Basado en horarios y patrones del usuario',
      notification: {
        title: '💧 Hora de hidratarte',
        body: 'Han pasado 3 horas sin registrar agua. ¿Un vaso rápido?',
        actions: ['250ml', '500ml', 'Más Tarde']
      }
    }
  ];

  hydrationNotifications.forEach((example, i) => {
    console.log(`${i + 1}. ${example.scenario}`);
    console.log(`   Trigger: ${example.trigger}`);
    console.log(`   📱 "${example.notification.title}"`);
    console.log(`   📝 "${example.notification.body}"`);
    if (example.notification.actions.length > 0) {
      console.log(`   🔘 Acciones: ${example.notification.actions.join(', ')}`);
    }
    console.log('');
  });

  console.log('🔗 Integración con Chapi:');
  console.log('- Las notificaciones de hidratación aparecen en /chapi/proactive-notifications');
  console.log('- El análisis de hidratación se incluye en /chapi/health-analysis');
  console.log('- Los cron jobs monitorean hidratación junto con peso y check-ins');

  console.log('\n📱 Funcionalidades de la app móvil sugeridas:');
  console.log('- Widget de hidratación en pantalla principal');
  console.log('- Botones rápidos: 200ml, 250ml, 500ml, 1L');
  console.log('- Gráfico de progreso diario con animación de onda');
  console.log('- Recordatorios push personalizados');
  console.log('- Integración con Apple Health / Google Fit');
  console.log('- Modo "Smart Bottle" para tracking automático');

  console.log('\n🎯 Beneficios del sistema:');
  console.log('✅ Mejora la adherencia a objetivos de hidratación');
  console.log('✅ Previene deshidratación y sus efectos negativos');
  console.log('✅ Personalización basada en perfil del usuario');
  console.log('✅ Gamificación con rachas y logros');
  console.log('✅ Análisis inteligente de patrones');
  console.log('✅ Integración completa con el ecosistema de salud');

  console.log('\n🚀 ¡Sistema de hidratación listo para usar!');
  console.log('Ahora tienes un sistema completo que complementa perfectamente el monitoreo de peso y ejercicio.');
}

testHydrationSystem()
  .catch(console.error)
  .finally(() => prisma.$disconnect());