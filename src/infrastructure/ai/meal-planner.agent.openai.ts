import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { MealPlannerAgentPort } from '../../core/application/plans/ports/out.meal-planner-agent.port';
import { PlanDay } from '../../core/domain/plans/entities';
import { PrismaService } from '../database/prisma.service';
import { createHash } from 'crypto';

// ─────────────────────────────────────────────────────────────
// Zod schemas - with coercion to handle AI returning strings for numbers
const MealSchemaCompact = z.object({
  slot: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']),
  title: z.string().min(3),
  kcal: z.coerce.number().int().nonnegative().optional().default(0),
  protein_g: z.coerce.number().int().nonnegative().optional().default(0),
  carbs_g: z.coerce.number().int().nonnegative().optional().default(0),
  fat_g: z.coerce.number().int().nonnegative().optional().default(0),
});

const DayResponseSchemaCompact = z.object({
  dayIndex: z.number().int().min(1).max(7),
  meals: z.array(MealSchemaCompact).min(3).max(3),
});

const WeekResponseSchema = z.object({
  notes: z.string().optional(),
  days: z
    .array(
      z.object({
        dayIndex: z.number().int().min(1).max(7),
        meals: z.array(z.any()).min(1),
      }),
    )
    .length(7),
});

// Para micro-prompt de ingredientes
const IngredientSchema = z.object({
  name: z.string(),
  qty: z.coerce.number().positive().optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
});
const IngredientListSchema = z.object({
  ingredients: z.array(IngredientSchema).min(3).max(7),
});

// Sanitizar y reparar JSON malformado - Encuentra el primer JSON válido
function sanitizeToJson(raw: string): string {
  // Step 1: Remove markdown code blocks
  let cleaned = raw.replace(/```json|```/g, '');
  
  // Step 2: Remove control characters (but keep valid JSON chars)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Step 3: Find the start of JSON
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }
  
  if (start === -1) return '{}';
  
  // Step 4: Find the FIRST complete JSON by counting braces/brackets
  const startChar = cleaned[start];
  const openChar = startChar;
  const closeChar = startChar === '{' ? '}' : ']';
  
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  
  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
  }
  
  if (end === -1) return '{}';
  
  cleaned = cleaned.slice(start, end + 1);
  
  // Step 5: Minimal cleaning - only remove newlines from string values
  cleaned = cleaned.replace(/"((?:[^"\\]|\\.)*)"/g, (match, content) => {
    let fixed = content
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `"${fixed}"`;
  });
  
  // Step 6: Validate
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (e: any) {
    console.error('[sanitizeToJson] Still failed after cleaning:', e.message);
    console.error('[sanitizeToJson] Cleaned JSON:', cleaned.substring(0, 500));
    return cleaned;
  }
}

// util: concurrent mapper con límite
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const ret: R[] = new Array(items.length) as R[];
  let idx = 0;
  const workers = Array(Math.min(limit, items.length))
    .fill(0)
    .map(async () => {
      while (true) {
        const i = idx++;
        if (i >= items.length) break;
        ret[i] = await fn(items[i]);
      }
    });
  await Promise.all(workers);
  return ret;
}

function weekSeed(userId: string, weekStart: Date): number {
  const s = `${userId}|${weekStart.toISOString().slice(0, 10)}`;
  const hex = createHash('sha1').update(s).digest('hex').slice(0, 8);
  return parseInt(hex, 16);
}

function toLowerSet(arr?: string[]): Set<string> {
  const s = new Set<string>();
  for (const t of arr ?? []) if (t) s.add(t.toLowerCase());
  return s;
}

@Injectable()
export class OpenAIMealPlannerAgent implements MealPlannerAgentPort {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 25000),
  });

  private model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  private maxTokens = +(5000); // por día / swap
  private concurrency = +(process.env.OPENAI_CONCURRENCY ?? 3);
  private ingConcurrency = Math.max(1, Math.min(4, +(process.env.OPENAI_ING_CONCURRENCY ?? 2)));

  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // Helpers comunes
  private async askJson(params: {
    system: string;
    user: string;
    maxTokens: number;
    schema?: any; // JSON Schema para structured outputs
  }): Promise<{ raw: string; finish: string | null }> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.8,
      max_tokens: params.maxTokens,
      // Use structured outputs if schema provided, otherwise use json_object
      response_format: params.schema 
        ? { type: 'json_schema', json_schema: params.schema }
        : { type: 'json_object' },
      presence_penalty: 0.5,
      frequency_penalty: 0.9,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
    });
    const finish = completion.choices[0]?.finish_reason ?? null;
    const raw = completion.choices[0]?.message?.content ?? '{}';
    return { raw, finish };
  }

  private commonContext(
    macros: { kcalTarget: number; protein_g: number; carbs_g: number; fat_g: number },
    preferences?: {
      allergies?: string[];
      cuisinesLike?: string[];
      cuisinesDislike?: string[];
      cookTimePerMeal?: number | null;
      nutritionGoal?: string | null;
      targetWeightKg?: number | null;
      timeFrame?: string | null;
      intensity?: string | null;
      currentMotivation?: string | null;
    },
    avoidTitles?: string[],
  ): string {
    const avoidNormalized = [...toLowerSet(avoidTitles)];
    
    // Detectar si el user es vegetariano
    const isVegetarian = (preferences?.cuisinesLike ?? []).some(c => 
      c.toLowerCase().includes('vegetarian') || c.toLowerCase().includes('vegana')
    );
    
    const baseRules = [
      'Eres un nutricionista asistido por IA.',
      'Debes responder SIEMPRE en español neutro (no uses inglés).',
      'Nombres de platos en español estándar (ej: "Avena con frutas", "Pollo con quinoa", "Ensalada de garbanzos").',
      `Objetivo calórico por día: ${macros.kcalTarget} kcal. Macros aprox: P ${macros.protein_g}g / C ${macros.carbs_g}g / G ${macros.fat_g}g.`,
      `Restringe alergias: ${(preferences?.allergies ?? []).join(', ') || 'ninguna'}.`,
    ];

    // Reglas de tiempo de cocina
    if (preferences?.cookTimePerMeal) {
      baseRules.push(
        `⏱️ TIEMPO DE COCINA: Maximiza recetas que se preparen en ${preferences.cookTimePerMeal} minutos o menos.`,
        'Prioriza preparaciones sencillas y rápidas si el tiempo es corto.',
      );
    }

    // Reglas de Objetivo Nutricional
    if (preferences?.nutritionGoal) {
      const goalMap: Record<string, string> = {
        'LOSE_WEIGHT': '📉 OBJETIVO: PERDER PESO. Prioriza alimentos saciantes, altos en fibra, verduras y buena proteína. Evita excesos de carbos refinados.',
        'GAIN_WEIGHT': '📈 OBJETIVO: GANAR PESO. Prioriza densidad calórica saludable (frutos secos, aguacate, aceite de oliva, más carbohidratos complejos).',
        'MAINTAIN_WEIGHT': '⚖️ OBJETIVO: MANTENER PESO. Balance general saludable.',
        'GAIN_MUSCLE': '💪 OBJETIVO: GANAR MÚSCULO. Asegura ingesta de proteínas de alta biodisponibilidad en cada comida. Carbohidratos para energía.',
        'IMPROVE_HEALTH': '❤️ OBJETIVO: SALUD GENERAL. Enfócate en micronutrientes, variedad de colores en vegetales, grasas saludables.',
      };
      const goalInst = goalMap[preferences.nutritionGoal] ?? `Objetivo: ${preferences.nutritionGoal}`;
      baseRules.push(goalInst);
    }

    // Reglas de Motivación
    if (preferences?.currentMotivation) {
      baseRules.push(
        `💡 MOTIVACIÓN DEL USUARIO: "${preferences.currentMotivation}".`,
        'Ten en cuenta esto para seleccionar platos que se alineen con este deseo (ej. si quiere energía, evita comidas pesadas que den sueño).',
      );
    }
    
    // Manejo de preferencias de cocina
    const cuisinesLike = preferences?.cuisinesLike ?? [];
    const cuisinesDislike = preferences?.cuisinesDislike ?? [];
    
    // Si es vegetariano, sobrescribir las reglas de proteínas
    if (isVegetarian) {
      baseRules.push(
        '⚠️ DIETA VEGETARIANA ESTRICTA: NO uses NINGUNA carne (pollo, pescado, res, cerdo, pavo, cordero, mariscos, etc.).',
        'Fuentes de proteína PERMITIDAS: legumbres (lentejas, garbanzos, frijoles), tofu, tempeh, seitán, huevos, lácteos (queso, yogur), quinoa, frutos secos, semillas.',
        'PRIORIZA platos vegetarianos variados y balanceados.',
      );
    }
    
    // Reglas de preferencias de cocina
    if (cuisinesLike.length > 0) {
      baseRules.push(
        `✅ COCINAS PREFERIDAS (USA SOLO ESTAS): ${cuisinesLike.join(', ')}.`,
        `⚠️ IMPORTANTE: Genera platos EXCLUSIVAMENTE de estas cocinas. Alterna entre ellas para variedad.`,
      );
    }
    
    if (cuisinesDislike.length > 0) {
      baseRules.push(
        `❌ COCINAS A EVITAR (NO USES NINGUNA): ${cuisinesDislike.join(', ')}.`,
        `⚠️ CRÍTICO: NO generes platos de estas cocinas bajo ninguna circunstancia.`,
      );
    }
    
    // Si no tiene preferencias específicas, dar variedad general
    if (cuisinesLike.length === 0 && cuisinesDislike.length === 0) {
      baseRules.push(
        '🌎 VARIEDAD: Alterna entre diferentes estilos de cocina (chilena, mediterránea, asiática, latinoamericana, etc.) para mantener variedad.',
      );
    }
    
    baseRules.push(
      avoidNormalized.length
        ? `Evita repetir (o variantes muy parecidas) de: ${avoidNormalized.slice(0, 40).map(t => `"${t}"`).join(', ')}.`
        : 'Evita repetir títulos dentro de esta semana.',
      'Devuelve **solo** JSON válido (sin bloques de código ni explicaciones).',
    );
    
    return baseRules.filter(Boolean).join('\n');
  }

  private daySchemaCompact(dayIndexHint?: number) {
    return `Schema EXACTO (3 comidas: BREAKFAST, LUNCH, DINNER, sin ingredients/tags):
{
  "dayIndex": ${dayIndexHint ?? '1..7'},
  "meals": [
    { "slot": "BREAKFAST", "title": string, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number },
    { "slot": "LUNCH", "title": string, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number },
    { "slot": "DINNER", "title": string, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number }
  ]
}`;
  }

  // ─────────────────────────────────────────────────────────────
  // Ingredientes (micro-prompt por comida)
  private async draftIngredientsForMeal(meal: { title: string; slot: string }) {
    const system = 'Responde SIEMPRE en español. Devuelve únicamente JSON válido (sin explicaciones).';
    const user = [
      `Dado este plato: "${meal.title}" (slot: ${meal.slot}).`,
      `Devuelve de 3 a 7 ingredientes con cantidad y unidad cuando aplique.`,
      `Formato exacto: { "ingredients": [ { "name": string, "qty"?: number, "unit"?: string, "category"?: string } ] }`,
      `Ejemplos de unidades: "g", "ml", "cda", "cdta", "taza", "unidad".`,
      `Evita cantidades absurdas. Mantén español neutro.`,
    ].join('\n');

    const { raw } = await this.askJson({
      system,
      user,
      maxTokens: 220,
    });

    const json = sanitizeToJson(raw);
    const parsed = IngredientListSchema.safeParse(JSON.parse(json));
    if (!parsed.success) {
      // Si falla el parseo, devolvemos vacío (no bloqueamos el flujo)
      return [] as Array<{ name: string; qty?: number; unit?: string; category?: string }>;
    }
    return parsed.data.ingredients;
  }

  private async ensureIngredients(days: PlanDay[]) {
    // Recorremos todas las comidas de la semana y pedimos ingredientes a las que no tengan
    const allMeals: Array<{ day: PlanDay; index: number }> = [];
    for (const d of days) {
      d.meals.forEach((_, i) => allMeals.push({ day: d, index: i }));
    }
    await mapWithConcurrency(allMeals, this.ingConcurrency, async ({ day, index }) => {
      const m = day.meals[index] as any;
      if (!m.ingredients || m.ingredients.length === 0) {
        m.ingredients = await this.draftIngredientsForMeal({ title: m.title, slot: m.slot });
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 1) Semana completa
  async draftWeekPlan({
    userId,
    weekStart,
    macros,
    preferences,
  }: {
    userId: string;
    weekStart: Date;
    macros: { kcalTarget: number; protein_g: number; carbs_g: number; fat_g: number };
    preferences?: {
      allergies?: string[];
      cuisinesLike?: string[];
      cuisinesDislike?: string[];
      cookTimePerMeal?: number | null;
      nutritionGoal?: string | null;
      targetWeightKg?: number | null;
      timeFrame?: string | null;
      intensity?: string | null;
      currentMotivation?: string | null;
    };
  }): Promise<{ days: PlanDay[]; notes?: string }> {
    try {
      // títulos de 6 semanas para anti-repetición
      const sixWeeksAgo = new Date(weekStart);
      sixWeeksAgo.setUTCDate(sixWeeksAgo.getUTCDate() - 42);

      const prevPlans = await this.prisma.plan.findMany({
        where: { userId, weekStart: { gte: sixWeeksAgo, lt: weekStart } },
        include: { days: { include: { meals: true } } },
        orderBy: { weekStart: 'desc' },
        take: 6,
      });

      const prevTitles = new Set<string>();
      for (const p of prevPlans) {
        for (const d of p.days) {
          for (const m of d.meals) prevTitles.add(m.title.toLowerCase());
        }
      }

      // variedad con semilla - temas genéricos que no sobrescriben preferencias
      const seed = weekSeed(userId, weekStart);
      const themes = [
        'variedad balanceada',
        'enfoque en proteínas de calidad',
        'comidas rápidas y nutritivas',
        'platos caseros saludables',
        'opciones ligeras y frescas',
        'comidas reconfortantes',
        'preparaciones sencillas',
      ];
      const themeIdx = seed % themes.length;

      // rotación de slots
      // Ahora siempre son 3 comidas: BREAKFAST, LUNCH, DINNER
      const slotPatterns: Array<Array<'BREAKFAST' | 'LUNCH' | 'DINNER'>> = [
        ['BREAKFAST', 'LUNCH', 'DINNER'],
        ['BREAKFAST', 'LUNCH', 'DINNER'],
        ['BREAKFAST', 'LUNCH', 'DINNER'],
        ['BREAKFAST', 'LUNCH', 'DINNER'],
        ['BREAKFAST', 'LUNCH', 'DINNER'],
        ['BREAKFAST', 'LUNCH', 'DINNER'],
        ['BREAKFAST', 'LUNCH', 'DINNER'],
      ];

      const baseContext = this.commonContext(macros, preferences, Array.from(prevTitles));

      // anti-repetición semanal - GENERACIÓN SECUENCIAL para mejor variedad
      const usedTitlesThisWeek = new Set<string>();

      const dayIndices = [1, 2, 3, 4, 5, 6, 7];
      const days: PlanDay[] = [];
      
      // Generar día por día (secuencial) para evitar repeticiones
      for (const dayIndex of dayIndices) {
        const slots = slotPatterns[(themeIdx + dayIndex - 1) % slotPatterns.length];
        
        // Lista de títulos usados hasta ahora (limitado a 15 para no saturar el prompt)
        const usedTitlesStr = usedTitlesThisWeek.size > 0 
          ? `Ya usaste en días anteriores: ${[...usedTitlesThisWeek].slice(-15).join(', ')}. NO REPITAS NINGUNO.`
          : '';

        const userPrompt = [
          baseContext,
          `Estilo sugerido: ${themes[themeIdx]}.`,
          `Genera el JSON del día ${dayIndex}. EXACTAMENTE 3 comidas: BREAKFAST, LUNCH, DINNER.`,
          `Distribuye kcal para sumar aproximadamente ${macros.kcalTarget} kcal en el día.`,
          'Evita anglicismos; usa "porridge de avena", "salteado de…", "ensalada de…", etc.',
          '⚠️ CRÍTICO - FORMATO JSON ESTRICTO:',
          '- En el campo "title": usa SOLO letras, números, espacios, guiones (-) y puntos (.)',
          '- NO uses comillas dobles ("), comillas simples (\'), apóstrofes, paréntesis, corchetes, ni caracteres especiales',
          '- Si necesitas mencionar cantidades o medidas, escríbelas en palabras (ej: "Ensalada de quinoa con verduras" NO "Ensalada de quinoa (200g)")',
          '- NUNCA incluyas saltos de línea dentro de valores string',
          '- ASEGÚRATE de que TODOS los campos numéricos (kcal, protein_g, carbs_g, fat_g) sean números enteros positivos',
          'IMPORTANTE: Varía las proteínas. Rota entre: pollo, pescado, legumbres, huevos, carne roja, tofu, etc. No repitas la misma proteína en comidas consecutivas ni en días consecutivos si es posible.',
          'VARIEDAD CRÍTICA: Cada día debe tener platos DIFERENTES. No repitas desayunos, almuerzos ni cenas. Sé creativo.',
          usedTitlesStr,
          this.daySchemaCompact(dayIndex),
        ].join('\n\n');

        // JSON Schema estricto para structured outputs
        const daySchema = {
          name: 'day_plan',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              dayIndex: { type: 'integer', minimum: 1, maximum: 7 },
              meals: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: {
                  type: 'object',
                  properties: {
                    slot: { type: 'string', enum: ['BREAKFAST', 'LUNCH', 'DINNER'] },
                    title: { type: 'string' },
                    kcal: { type: 'integer', minimum: 0 },
                    protein_g: { type: 'integer', minimum: 0 },
                    carbs_g: { type: 'integer', minimum: 0 },
                    fat_g: { type: 'integer', minimum: 0 },
                  },
                  required: ['slot', 'title', 'kcal', 'protein_g', 'carbs_g', 'fat_g'],
                  additionalProperties: false,
                },
              },
            },
            required: ['dayIndex', 'meals'],
            additionalProperties: false,
          },
        };

        const { raw, finish } = await this.askJson({
          system: 'Responde SIEMPRE en español. Devuelve únicamente JSON válido (sin explicaciones).',
          user: userPrompt,
          maxTokens: this.maxTokens,
          schema: daySchema,
        });

        if (finish === 'length') {
          throw new Error(`Truncado por tokens en dayIndex=${dayIndex}. Sube OPENAI_MAX_TOKENS.`);
        }

        // Log the raw response for debugging
        if (dayIndex === 6) { // Solo para el día 6 que está fallando
          console.log(`[MealPlanner] Day ${dayIndex} - Raw AI response:`, raw.substring(0, 800));
        }

        const json = sanitizeToJson(raw);
        
        if (dayIndex === 6) {
          console.log(`[MealPlanner] Day ${dayIndex} - After sanitization:`, json.substring(0, 800));
        }
        
        let parsedJson: any;
        try {
          parsedJson = JSON.parse(json);
        } catch (parseError: any) {
          console.error(`[MealPlanner] JSON parse error for dayIndex=${dayIndex}`);
          console.error(`[MealPlanner] Raw response:`, raw);
          console.error(`[MealPlanner] Sanitized JSON:`, json);
          console.error(`[MealPlanner] Parse error:`, parseError.message);
          console.error(`[MealPlanner] Problematic character at position:`, parseError.message.match(/position (\d+)/)?.[1]);
          
          // Try to show context around the error position
          if (parseError.message.includes('position')) {
            const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
            const start = Math.max(0, pos - 50);
            const end = Math.min(json.length, pos + 50);
            console.error(`[MealPlanner] Context around error:`, json.substring(start, end));
          }
          
          throw new Error(`JSON parse failed in dayIndex=${dayIndex}: ${parseError.message}. Check logs for details.`);
        }
        
        const parsed = DayResponseSchemaCompact.safeParse(parsedJson);
        if (!parsed.success) {
          console.error(`[MealPlanner] Zod validation error for dayIndex=${dayIndex}:`, parsed.error.message);
          console.error(`[MealPlanner] Parsed JSON structure:`, JSON.stringify(parsedJson, null, 2));
          throw new Error(`Validación JSON falló en dayIndex=${dayIndex}: ${parsed.error.message}`);
        }

        // Guardar títulos usados
        parsed.data.meals.forEach((m) => usedTitlesThisWeek.add(m.title.toLowerCase()));

        days.push({
          dayIndex,
          meals: parsed.data.meals,
        });
      }

      // ✅ Completar ingredientes (micro-prompt barato por comida)
      await this.ensureIngredients(days);

      // Notas (opcional, muy corto)
      let notes: string | undefined = undefined;
      try {
        const { raw } = await this.askJson({
          system: 'Responde en español. Devuelve únicamente JSON válido.',
          user: 'Devuelve {"notes":"tip motivador muy corto (<= 10 palabras) en español"}',
          maxTokens: Math.min(this.maxTokens, 120),
        });
        const jsonNotes = sanitizeToJson(raw);
        const parsed = z.object({ notes: z.string().max(120) }).safeParse(JSON.parse(jsonNotes));
        if (parsed.success) notes = parsed.data.notes;
      } catch {}

      const weekly = WeekResponseSchema.safeParse({ notes, days });
      if (!weekly.success) {
        throw new Error('Validación final del plan semanal falló: ' + weekly.error.message);
      }

      days.sort((a, b) => a.dayIndex - b.dayIndex);
      return { days, notes };
    } catch (e: any) {
      throw new InternalServerErrorException(`MealPlannerAgent error: ${e?.message ?? e}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2) Regenerar un día puntual
  async draftDayPlan({
    userId,
    weekStart,
    dayIndex,
    macros,
    preferences,
    avoidTitles,
  }: {
    userId: string;
    weekStart: Date;
    dayIndex: number;
    macros: { kcalTarget: number; protein_g: number; carbs_g: number; fat_g: number };
    preferences?: {
      allergies?: string[];
      cuisinesLike?: string[];
      cuisinesDislike?: string[];
      cookTimePerMeal?: number | null;
      nutritionGoal?: string | null;
      targetWeightKg?: number | null;
      timeFrame?: string | null;
      intensity?: string | null;
      currentMotivation?: string | null;
    };
    avoidTitles?: string[];
  }): Promise<{ day: PlanDay }> {
    try {
      const seed = weekSeed(userId, weekStart) ^ dayIndex;
      const baseContext = this.commonContext(macros, preferences, avoidTitles);

      const userPrompt = [
        baseContext,
        `Genera el JSON del día ${dayIndex}. EXACTAMENTE 3 comidas: BREAKFAST, LUNCH, DINNER.`,
        `Evita títulos repetidos o muy similares a: ${avoidTitles?.slice(0, 40).join(' | ') || '(ninguno)'}`,
        `Varía estilos y combinaciones (semilla: ${seed}).`,
        'IMPORTANTE: Varía las proteínas. Rota entre: pollo, pescado, legumbres, huevos, carne roja, tofu, etc.',
        this.daySchemaCompact(dayIndex),
      ].join('\n\n');

      const { raw, finish } = await this.askJson({
        system: 'Responde SIEMPRE en español. Devuelve únicamente JSON válido (sin explicaciones).',
        user: userPrompt,
        maxTokens: this.maxTokens,
      });

      if (finish === 'length') {
        throw new Error(`Truncado por tokens en draftDayPlan dayIndex=${dayIndex}.`);
      }

      const json = sanitizeToJson(raw);
      const parsed = DayResponseSchemaCompact.safeParse(JSON.parse(json));
      if (!parsed.success) {
        throw new Error(`Validación JSON (draftDayPlan) falló en d${dayIndex}: ${parsed.error.message}`);
      }

      const day: PlanDay = {
        dayIndex,
        meals: parsed.data.meals as any,
      };

      // ✅ ingredientes
      await this.ensureIngredients([day]);

      return { day };
    } catch (e: any) {
      throw new InternalServerErrorException(`MealPlannerAgent error: ${e?.message ?? e}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3) Sugerir swap para UNA comida
  async suggestSwap({
    userId,
    weekStart,
    dayIndex,
    macros,
    target,
    preferences,
    avoidTitles,
  }: {
    userId: string;
    weekStart: Date;
    dayIndex: number;
    macros: { kcalTarget: number; protein_g: number; carbs_g: number; fat_g: number };
    target: { slot: PlanDay['meals'][number]['slot']; kcal: number };
    preferences?: {
      allergies?: string[];
      cuisinesLike?: string[];
      cuisinesDislike?: string[];
      cookTimePerMeal?: number | null;
      nutritionGoal?: string | null;
      targetWeightKg?: number | null;
      timeFrame?: string | null;
      intensity?: string | null;
      currentMotivation?: string | null;
    };
    avoidTitles?: string[];
  }): Promise<{ meal: PlanDay['meals'][number] }> {
    try {
      const seed = weekSeed(userId, weekStart) ^ (dayIndex * 17);
      const baseContext = this.commonContext(macros, preferences, avoidTitles);

      const kcalMin = Math.round(target.kcal * 0.85);
      const kcalMax = Math.round(target.kcal * 1.15);

      const userPrompt = [
        baseContext,
        `SUGIERE UNA SOLA COMIDA para reemplazar en el día ${dayIndex}.`,
        `Debe mantener el slot: "${target.slot}".`,
        `Calorías objetivo entre ${kcalMin} y ${kcalMax}.`,
        `Evita títulos repetidos o muy similares a: ${avoidTitles?.slice(0, 40).join(' | ') || '(ninguno)'}`,
        `Varía estilos y combinaciones (semilla: ${seed}).`,
        `Esquema exacto de salida (JSON): { "slot": "${target.slot}", "title": string, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number }`,
      ].join('\n\n');

      const { raw, finish } = await this.askJson({
        system: 'Responde SIEMPRE en español. Devuelve únicamente JSON válido (sin explicaciones).',
        user: userPrompt,
        maxTokens: Math.min(this.maxTokens, 260),
      });

      if (finish === 'length') {
        throw new Error(`Truncado por tokens en suggestSwap día ${dayIndex}.`);
      }

      const json = sanitizeToJson(raw);
      const parsed = MealSchemaCompact.safeParse(JSON.parse(json));
      if (!parsed.success) {
        throw new Error(`Validación JSON (swap) falló: ${parsed.error.message}`);
      }

      const meal = parsed.data as any;

      // ✅ ingredientes del swap
      meal.ingredients = await this.draftIngredientsForMeal({
        title: meal.title,
        slot: meal.slot,
      });

      // defensa
      if (meal.slot !== target.slot) meal.slot = target.slot as any;

      return { meal };
    } catch (e: any) {
      throw new InternalServerErrorException(`MealPlannerAgent error: ${e?.message ?? e}`);
    }
  }
}
