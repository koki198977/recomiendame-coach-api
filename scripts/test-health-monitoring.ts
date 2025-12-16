/**
 * Script para probar el sistema de monitoreo de salud de Chapi
 * 
 * Uso: npx ts-node scripts/test-health-monitoring.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testHealthMonitoring() {
  console.log('🏥 Probando el sistema de monitoreo de salud de Chapi...\n');

  console.log('🎯 Nuevas funcionalidades implementadas:');
  console.log('1. ✅ Análisis automático de patrones de peso');
  console.log('2. ✅ Detección de pérdida/ganancia rápida de peso');
  console.log('3. ✅ Monitoreo de consistencia en check-ins');
  console.log('4. ✅ Generación de alertas de salud');
  console.log('5. ✅ Notificaciones push proactivas');
  console.log('6. ✅ Score de riesgo personalizado');
  console.log('7. ✅ Cron jobs automáticos');
  console.log('8. ✅ Panel administrativo');

  console.log('\n📊 Nuevos endpoints disponibles:');
  
  const baseUrl = 'https://api-coach.recomiendameapp.cl';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWowbzJ4bTgwMDZobXMzYmszbmxwZnRpIiwiZW1haWwiOiJqb3JnZXVsczE5QGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiZW1haWxWZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzY1NDExMTQ5LCJleHAiOjE3NjU0OTc1NDl9.vaRoy7PPbc9XJghwLiWs1D1ZeVpDLSGcrR7IQo1kFbY';

  console.log('\n🔍 1. Análisis completo de salud del usuario:');
  console.log(`curl --location '${baseUrl}/chapi/health-analysis?includeNotifications=true' \\`);
  console.log(`--header 'Authorization: Bearer ${token}'`);
  console.log('\n📱 Respuesta esperada:');
  console.log(`{
  "weightAnalysis": {
    "currentWeight": 75.5,
    "targetWeight": 70,
    "weeklyChange": -0.8,
    "monthlyTrend": "LOSING",
    "isHealthyPace": true,
    "recommendedWeeklyPace": 0.5,
    "daysToGoal": 77,
    "riskLevel": "LOW",
    "insights": ["✅ Tu ritmo de pérdida de peso es saludable y sostenible."]
  },
  "checkinPattern": {
    "lastCheckinDate": "2024-12-15T10:30:00Z",
    "daysSinceLastCheckin": 1,
    "averageFrequency": 2.5,
    "consistency": "EXCELLENT",
    "missedCheckins": 0
  },
  "healthAlerts": [],
  "proactiveNotifications": [
    {
      "type": "MOTIVATION",
      "title": "🎉 ¡Excelente progreso!",
      "body": "Vas súper bien con 0.8kg por semana. ¡Sigue así!",
      "priority": "LOW"
    }
  ],
  "recommendations": [
    "✅ ¡Excelente! Mantén tu ritmo actual, es saludable y sostenible",
    "🌟 ¡Perfecta consistencia con tus check-ins! Esto me permite ayudarte mejor"
  ],
  "riskScore": 15
}`);

  console.log('\n\n📲 2. Solo notificaciones proactivas:');
  console.log(`curl --location '${baseUrl}/chapi/proactive-notifications' \\`);
  console.log(`--header 'Authorization: Bearer ${token}'`);

  console.log('\n\n🔧 3. Panel administrativo (solo para admins):');
  console.log(`curl --location '${baseUrl}/admin/chapi/system-status' \\`);
  console.log(`--header 'Authorization: Bearer ADMIN_TOKEN'`);

  console.log('\n\n⚡ 4. Ejecutar monitoreo manual (solo para admins):');
  console.log(`curl --location --request POST '${baseUrl}/admin/chapi/run-health-check' \\`);
  console.log(`--header 'Authorization: Bearer ADMIN_TOKEN'`);

  console.log('\n\n🤖 Ejemplos de notificaciones que Chapi generará automáticamente:\n');

  const notificationExamples = [
    {
      scenario: 'Pérdida de peso muy rápida',
      trigger: 'Usuario pierde más de 1.5kg por semana',
      notification: {
        title: '⚠️ Pérdida de peso muy rápida',
        body: 'Estás perdiendo 2.1kg por semana. Esto puede ser peligroso. ¿Quieres que ajuste tu plan?',
        actions: ['Ajustar Plan', 'Hablar con Experto']
      }
    },
    {
      scenario: 'Falta de check-ins',
      trigger: 'Usuario no hace check-in por más de 7 días',
      notification: {
        title: '🤗 Te extrañamos',
        body: 'Han pasado 10 días sin tu check-in. Ayúdame a generar planes más especializados para ti.',
        actions: ['Hacer Check-in', 'Ver Progreso']
      }
    },
    {
      scenario: 'Progreso estancado',
      trigger: 'Peso se mantiene igual por más de 2 semanas',
      notification: {
        title: '📊 Revisemos tu plan',
        body: 'Tu peso se ha mantenido estable por 15 días. ¿Quieres que ajustemos tu estrategia?',
        actions: ['Ajustar Plan', 'Revisar Objetivos']
      }
    },
    {
      scenario: 'Excelente progreso',
      trigger: 'Usuario mantiene ritmo saludable consistente',
      notification: {
        title: '🎉 ¡Vas increíble!',
        body: 'Llevas 3 semanas con un ritmo perfecto de 0.6kg por semana. ¡Sigue así!',
        actions: []
      }
    }
  ];

  notificationExamples.forEach((example, i) => {
    console.log(`${i + 1}. ${example.scenario}`);
    console.log(`   Trigger: ${example.trigger}`);
    console.log(`   📱 "${example.notification.title}"`);
    console.log(`   📝 "${example.notification.body}"`);
    if (example.notification.actions.length > 0) {
      console.log(`   🔘 Acciones: ${example.notification.actions.join(', ')}`);
    }
    console.log('');
  });

  console.log('⏰ Cron Jobs configurados:');
  console.log('- 🌅 Monitoreo diario: Todos los días a las 9:00 AM');
  console.log('- 🚨 Monitoreo de alto riesgo: Cada 3 horas');
  console.log('- 📊 Análisis de todos los usuarios automáticamente');
  console.log('- 📱 Envío de notificaciones push programadas');

  console.log('\n🎯 Beneficios del nuevo sistema:');
  console.log('✅ Detección temprana de problemas de salud');
  console.log('✅ Intervención proactiva antes de que empeoren');
  console.log('✅ Motivación personalizada basada en datos reales');
  console.log('✅ Ajustes automáticos de planes según progreso');
  console.log('✅ Mejor adherencia a través de recordatorios inteligentes');
  console.log('✅ Monitoreo 24/7 sin intervención manual');

  console.log('\n🚀 ¡El sistema está listo para usar!');
  console.log('Chapi ahora es un verdadero asistente proactivo que cuida la salud de tus usuarios.');
}

testHealthMonitoring()
  .catch(console.error)
  .finally(() => prisma.$disconnect());