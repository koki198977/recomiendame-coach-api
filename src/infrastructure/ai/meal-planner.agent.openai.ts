// src/infrastructure/ai/meal-planner.agent.openai.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { MealPlannerAgentPort } from '../../core/application/plans/ports/out.meal-planner-agent.port';
import { PlanDay } from '../../core/domain/plans/entities';
import { PrismaService } from '../database/prisma.service';
import { createHash } from 'crypto';

// ─────────────────────────────────────────────────────────────
// Zod schema compacto: 2 comidas, sin ingredients/tags
const MealSchemaCompact = z.object({
  slot: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  title: z.string().min(3),
  kcal: z.number().int().positive(),
  protein_g: z.number().int().nonnegative(),
  carbs_g: z.number().int().nonnegative(),
  fat_g: z.number().int().nonnegative(),
});

const DayResponseSchemaCompact = z.object({
  dayIndex: z.number().int().min(1).max(7),
  meals: z.array(MealSchemaCompact).min(2).max(2),
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

// Sanitizar por si llegan fences
function sanitizeToJson(raw: string): string {
  const cleaned = raw.replace(/```json|```/g, '');
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) return cleaned.trim();
  return cleaned.slice(first, last + 1).trim();
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
  return parseInt(hex, 16); // 0..~4e9
}

@Injectable()
export class OpenAIMealPlannerAgent implements MealPlannerAgentPort {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 25000),
  });

  private model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  private maxTokens = +(process.env.OPENAI_MAX_TOKENS ?? 260); // por día
  private concurrency = +(process.env.OPENAI_CONCURRENCY ?? 3);

  constructor(private prisma: PrismaService) {}

  async draftWeekPlan({
    userId,
    weekStart,
    macros,
    preferences,
  }: {
    userId: string;
    weekStart: Date;
    macros: { kcalTarget: number; protein_g: number; carbs_g: number; fat_g: number };
    preferences?: { allergies?: string[]; cuisinesLike?: string[]; cuisinesDislike?: string[] };
  }): Promise<{ days: PlanDay[]; notes?: string }> {
    try {
      // 1) títulos usados recientemente (últimas 6 semanas)
      const sixWeeksAgo = new Date(weekStart);
      sixWeeksAgo.setUTCDate(sixWeeksAgo.getUTCDate() - 42);

      const prevPlans = await this.prisma.plan.findMany({
        where: { userId, weekStart: { gte: sixWeeksAgo, lt: weekStart } },
        include: { days: { include: { meals: true } } },
        orderBy: { weekStart: 'desc' },
        take: 6, // por si hay más de un plan semanal en el rango
      });

      const prevTitles = new Set<string>();
      for (const p of prevPlans) {
        for (const d of p.days) {
          for (const m of d.meals) prevTitles.add(m.title.toLowerCase());
        }
      }

      // 2) contexto común en ESPAÑOL
      const baseContext = [
        'Eres un nutricionista asistido por IA.',
        'Debes responder SIEMPRE en español neutro (no uses inglés).',
        'Nombres de platos en español estándar (por ejemplo: “Avena con frutas”, “Pollo con quinoa”, “Ensalada de garbanzos”).',
        `Objetivo calórico por día: ${macros.kcalTarget} kcal. Macros aprox: P ${macros.protein_g}g / C ${macros.carbs_g}g / G ${macros.fat_g}g.`,
        `Restringe alergias: ${(preferences?.allergies ?? []).join(', ') || 'ninguna'}.`,
        `Preferencias: ${(preferences?.cuisinesLike ?? []).join(', ') || 'ninguna'}. Evitar: ${
          (preferences?.cuisinesDislike ?? []).join(', ') || 'ninguna'
        }.`,
        'Devuelve **solo** JSON válido (sin bloques de código).',
        `Schema EXACTO (2 comidas, compacto, sin ingredients/tags):
{
  "dayIndex": 1..7,
  "meals": [
    { "slot": "BREAKFAST|LUNCH|DINNER|SNACK", "title": string, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number },
    { "slot": "BREAKFAST|LUNCH|DINNER|SNACK", "title": string, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number }
  ]
}`,
      ].join('\n');

      // 3) temas/distorsiones con semilla — variedad entre semanas
      const seed = weekSeed(userId, weekStart);
      const themes = [
        'toque mediterráneo',
        'toque chileno sencillo',
        'enfoque alto en proteína',
        'vegetariano fácil',
        'rápido 20 minutos',
        'inspiración mexicana suave',
        'inspiración peruana ligera',
      ];
      const themeIdx = seed % themes.length;

      // rotación de slots del día para variar BREAKFAST/LUNCH/DINNER
      const slotPatterns: Array<Array<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>> = [
        ['BREAKFAST', 'DINNER'],
        ['LUNCH', 'DINNER'],
        ['BREAKFAST', 'LUNCH'],
        ['SNACK', 'DINNER'],
        ['BREAKFAST', 'SNACK'],
        ['LUNCH', 'SNACK'],
        ['BREAKFAST', 'DINNER'],
      ];

      // 4) anti-repetición semanal
      const usedTitlesThisWeek = new Set<string>();

      const dayIndices = [1, 2, 3, 4, 5, 6, 7];
      const days = await mapWithConcurrency(dayIndices, this.concurrency, async (dayIndex) => {
        const avoid = [
          ...Array.from(prevTitles).slice(0, 40),
          ...Array.from(usedTitlesThisWeek).slice(0, 20),
        ];
        const antiRepeatHint =
          avoid.length > 0
            ? `Evita repetir estos títulos usados recientemente: ${avoid.join(' | ')}.`
            : 'Varía títulos y combinaciones; no repitas dentro de la semana.';

        const slots = slotPatterns[(themeIdx + dayIndex - 1) % slotPatterns.length];

        const userPrompt = [
          baseContext,
          `Tema libre del día: ${themes[themeIdx]}.`,
          `Genera el JSON del día ${dayIndex}. EXACTAMENTE 2 comidas en los slots: ${slots.join(' y ')}.`,
          `Distribuye kcal para sumar aproximadamente ${macros.kcalTarget} kcal en el día.`,
          antiRepeatHint,
          'Evita anglicismos; usa “porridge de avena”, “salteado de”, “ensalada de”, etc.',
        ].join('\n\n');

        const completion = await this.client.chat.completions.create({
          model: this.model,
          temperature: 0.3,
          max_tokens: this.maxTokens,
          response_format: { type: 'json_object' },
          // penaliza repeticiones
          presence_penalty: 0.1,
          frequency_penalty: 0.6,
          messages: [
            { role: 'system', content: 'Responde SIEMPRE en español. Devuelve únicamente JSON válido (sin explicaciones).' },
            { role: 'user', content: userPrompt },
          ],
        });

        const raw = completion.choices[0]?.message?.content ?? '{}';
        const json = sanitizeToJson(raw);
        const parsed = DayResponseSchemaCompact.safeParse(JSON.parse(json));
        if (!parsed.success) {
          throw new Error(`Validación JSON falló en dayIndex=${dayIndex}: ${parsed.error.message}`);
        }

        // marca títulos usados esta semana (en minúsculas)
        parsed.data.meals.forEach((m) => usedTitlesThisWeek.add(m.title.toLowerCase()));

        return {
          dayIndex,
          meals: parsed.data.meals,
        };
      });

      // 5) Notas (muy corta). Si falla, la ignoramos.
      let notes: string | undefined = undefined;
      try {
        const notesCompletion = await this.client.chat.completions.create({
          model: this.model,
          temperature: 0.1,
          max_tokens: Math.min(this.maxTokens, 120),
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'Responde en español. Devuelve únicamente JSON válido.' },
            { role: 'user', content: 'Devuelve {"notes":"tip motivador muy corto (<= 10 palabras) en español"}' },
          ],
        });
        const rawNotes = notesCompletion.choices[0]?.message?.content ?? '{}';
        const jsonNotes = sanitizeToJson(rawNotes);
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
}
