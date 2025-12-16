/**
 * Script para probar el nuevo sistema contextual de Chapi
 * 
 * Uso: npx ts-node scripts/test-chapi-context.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testChapiContext() {
  console.log('🧪 Probando el sistema contextual de Chapi...\n');

  // Simular diferentes tipos de mensajes
  const testMessages = [
    { message: 'Hola', expectedType: 'GREETING' },
    { message: 'Buenos días', expectedType: 'GREETING' },
    { message: 'Estoy muy motivado para ejercitarme hoy', expectedType: 'EMOTIONAL_EXPRESSION' },
    { message: 'Me siento un poco ansioso', expectedType: 'EMOTIONAL_EXPRESSION' },
    { message: 'Ya hice el ejercicio que me sugeriste', expectedType: 'FOLLOW_UP' },
    { message: 'Qué tal tu día', expectedType: 'CASUAL' },
    { message: 'Necesito motivación', expectedType: 'MOTIVATION_REQUEST' },
  ];

  console.log('📝 Mensajes de prueba:');
  testMessages.forEach((test, i) => {
    console.log(`${i + 1}. "${test.message}" → Esperado: ${test.expectedType}`);
  });

  console.log('\n✅ El nuevo sistema debería responder de manera diferente a cada tipo de mensaje:');
  console.log('- GREETING: Respuesta amigable sin análisis emocional completo');
  console.log('- EMOTIONAL_EXPRESSION: Análisis emocional completo con neurociencia');
  console.log('- FOLLOW_UP: Respuesta de seguimiento personalizada');
  console.log('- CASUAL: Conversación casual y natural');
  console.log('- MOTIVATION_REQUEST: Respuesta motivacional con sugerencias');

  console.log('\n🔄 Para probar en tu app, usa estos curl commands:\n');

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWowbzJ4bTgwMDZobXMzYmszbmxwZnRpIiwiZW1haWwiOiJqb3JnZXVsczE5QGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiZW1haWxWZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzY1NDExMTQ5LCJleHAiOjE3NjU0OTc1NDl9.vaRoy7PPbc9XJghwLiWs1D1ZeVpDLSGcrR7IQo1kFbY';

  testMessages.forEach((test, i) => {
    console.log(`# Prueba ${i + 1}: ${test.expectedType}`);
    console.log(`curl --location 'https://api-coach.recomiendameapp.cl/chapi/check-in' \\`);
    console.log(`--header 'Content-Type: application/json' \\`);
    console.log(`--header 'Authorization: Bearer ${token}' \\`);
    console.log(`--data '{"message": "${test.message}"}'`);
    console.log('');
  });

  console.log('🎯 Resultados esperados:');
  console.log('- "Hola" → Respuesta: "¡Hola! 😊 Me alegra verte por aquí. ¿Cómo te sientes hoy?"');
  console.log('- "Estoy motivado" → Análisis emocional completo con acciones específicas');
  console.log('- "Ya hice el ejercicio" → "¡Genial que me cuentes cómo te fue! 🎉"');
}

testChapiContext()
  .catch(console.error)
  .finally(() => prisma.$disconnect());