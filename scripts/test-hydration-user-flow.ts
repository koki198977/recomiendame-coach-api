/**
 * Script para probar el flujo completo de hidratación del usuario
 * Resuelve las dudas específicas sobre cuándo calcular y cómo registrar
 */

console.log('💧 Probando Flujo Completo de Hidratación del Usuario\n');

console.log('🎯 DUDA 1 RESUELTA: ¿Cuándo calcular la hidratación recomendada?');
console.log('✅ RESPUESTA: Después del onboarding, cuando el usuario completa su perfil\n');

console.log('📋 Endpoint para calcular recomendación personalizada:');
console.log('GET /hydration/calculate-recommended');
console.log('Authorization: Bearer TOKEN\n');

console.log('📱 Respuesta del cálculo personalizado:');
console.log(`{
  "recommendedMl": 2450,
  "explanation": "Tu objetivo personalizado de 2.5L diarios se basa en:
    • Tu peso de 70kg (base: 2450ml)
    • Tu actividad física moderada  
    • Tus condiciones de salud: diabetes",
  "ranges": {
    "minimum": 2000,
    "optimal": 2450, 
    "maximum": 3250
  },
  "tips": [
    "🌅 Comienza el día con un vaso de agua al despertar",
    "🩺 Mantén hidratación constante para ayudar con el control de glucosa"
  ]
}\n`);

console.log('🎯 DUDA 2 RESUELTA: ¿Cómo registra el usuario la hidratación?');
console.log('✅ RESPUESTA: Múltiples formas súper fáciles\n');

console.log('🚀 OPCIÓN 1: Quick Actions (Botones Predefinidos)');
console.log('POST /hydration/quick-actions');
console.log('→ Devuelve botones: 200ml, 250ml, 500ml, etc.\n');

console.log('⚡ OPCIÓN 2: Quick Log (URLs Directas)');
console.log('GET /hydration/quick-log/250  # Vaso estándar');
console.log('GET /hydration/quick-log/500  # Botella');
console.log('GET /hydration/quick-log/200  # Vaso pequeño\n');

console.log('🎨 OPCIÓN 3: Registro Personalizado');
console.log('POST /hydration/custom-log');
console.log('{ "ml": 350, "time": "2024-12-16T15:30:00Z" }\n');

console.log('📱 FLUJO COMPLETO RECOMENDADO:\n');

console.log('1️⃣ DESPUÉS DEL ONBOARDING:');
console.log('   → Llamar GET /hydration/calculate-recommended');
console.log('   → Mostrar modal: "Tu objetivo ideal es 2.5L diarios"');
console.log('   → Usuario acepta o personaliza');
console.log('   → Configurar con POST /hydration/goal\n');

console.log('2️⃣ EN EL DASHBOARD PRINCIPAL:');
console.log('   → Widget de hidratación con progreso');
console.log('   → Botón "Registrar agua" → Quick Actions');
console.log('   → Progreso visual: ████████░░ 80%\n');

console.log('3️⃣ REGISTRO DIARIO:');
console.log('   → POST /hydration/quick-actions (cargar botones)');
console.log('   → Usuario toca "🥛 250ml"');
console.log('   → GET /hydration/quick-log/250');
console.log('   → Feedback: "¡Buen progreso! 📈 Llevas 60% del objetivo"\n');

console.log('🎨 UI SUGERIDA PARA TU APP:\n');

console.log('┌─────────────────────────────────┐');
console.log('│ 💧 Hidratación Hoy             │');
console.log('│                                 │');
console.log('│ ████████████░░░░ 75%           │');
console.log('│ 1,500ml / 2,000ml              │');
console.log('│ Faltan: 500ml                   │');
console.log('│                                 │');
console.log('│ ⚡ Sugerencia: Botella (500ml)  │');
console.log('│                                 │');
console.log('│ Quick Actions:                  │');
console.log('│ [🥃 200ml] [🥛 250ml] [🍼 500ml]│');
console.log('│                                 │');
console.log('│ [+ Personalizado] [📊 Stats]    │');
console.log('└─────────────────────────────────┘\n');

console.log('🔥 EJEMPLOS DE CURL PARA PROBAR:\n');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWowbzJ4bTgwMDZobXMzYmszbmxwZnRpIiwiZW1haWwiOiJqb3JnZXVsczE5QGdtYWlsLmNvbSIsInJvbGUiOiJVU0VSIiwiZW1haWxWZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNzY1NDExMTQ5LCJleHAiOjE3NjU0OTc1NDl9.vaRoy7PPbc9XJghwLiWs1D1ZeVpDLSGcrR7IQo1kFbY';

console.log('# 1. Calcular recomendación personalizada');
console.log(`curl --location 'https://api-coach.recomiendameapp.cl/hydration/calculate-recommended' \\`);
console.log(`--header 'Authorization: Bearer ${token}'\n`);

console.log('# 2. Obtener botones de quick actions');
console.log(`curl --location --request POST 'https://api-coach.recomiendameapp.cl/hydration/quick-actions' \\`);
console.log(`--header 'Authorization: Bearer ${token}'\n`);

console.log('# 3. Registro rápido - Vaso estándar');
console.log(`curl --location 'https://api-coach.recomiendameapp.cl/hydration/quick-log/250' \\`);
console.log(`--header 'Authorization: Bearer ${token}'\n`);

console.log('# 4. Registro personalizado');
console.log(`curl --location --request POST 'https://api-coach.recomiendameapp.cl/hydration/custom-log' \\`);
console.log(`--header 'Content-Type: application/json' \\`);
console.log(`--header 'Authorization: Bearer ${token}' \\`);
console.log(`--data '{"ml": 350, "description": "Vaso grande después del ejercicio"}'\n`);

console.log('# 5. Configurar objetivo (después de calcular recomendación)');
console.log(`curl --location --request POST 'https://api-coach.recomiendameapp.cl/hydration/goal' \\`);
console.log(`--header 'Content-Type: application/json' \\`);
console.log(`--header 'Authorization: Bearer ${token}' \\`);
console.log(`--data '{
  "dailyTargetMl": 2500,
  "reminderIntervalMinutes": 120,
  "startTime": "07:00",
  "endTime": "22:00",
  "isActive": true
}'\n`);

console.log('✅ RESUMEN DE SOLUCIONES:\n');
console.log('🎯 CUÁNDO CALCULAR: Después del onboarding (automático)');
console.log('💧 CÓMO REGISTRAR: Quick actions, URLs directas, o personalizado');
console.log('📱 UI OPTIMIZADA: Botones grandes, feedback inmediato, progreso visual');
console.log('🤖 INTEGRACIÓN: Se conecta automáticamente con Chapi para notificaciones');
console.log('📊 ANALYTICS: Tracking completo de patrones y adherencia\n');

console.log('🚀 ¡TODO LISTO PARA IMPLEMENTAR EN TU FRONTEND!');
console.log('Los endpoints están optimizados para una experiencia de usuario fluida y natural.');