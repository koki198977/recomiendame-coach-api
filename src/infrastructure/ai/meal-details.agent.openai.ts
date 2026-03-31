import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { MealDetailsAgentPort } from '../../core/application/plans/ports/out.meal-details-agent.port';

const IngredientSchema = z.object({
  name: z.string().min(1),
  qty: z.coerce.number().positive().optional(),
  unit: z.string().optional(),
  category: z.string().optional(),
});

const MealDetailsSchema = z.object({
  ingredients: z.array(IngredientSchema).min(3).max(7),
  instructions: z.string().min(1),
});

// JSON Schema para structured outputs de OpenAI
const DETAILS_JSON_SCHEMA = {
  name: 'meal_details',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            qty: { type: 'number' },
            unit: { type: 'string' },
            category: { type: 'string' },
          },
          required: ['name', 'qty', 'unit', 'category'],
          additionalProperties: false,
        },
      },
      instructions: { type: 'string' },
    },
    required: ['ingredients', 'instructions'],
    additionalProperties: false,
  },
};

@Injectable()
export class OpenAIMealDetailsAgent implements MealDetailsAgentPort {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 30000),
  });

  private model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  async generateDetails(input: { title: string; slot: string }): Promise<{
    ingredients: Array<{ name: string; qty?: number; unit?: string; category?: string }>;
    instructions: string;
  }> {
    const slotLabel: Record<string, string> = {
      BREAKFAST: 'desayuno',
      LUNCH: 'almuerzo',
      DINNER: 'cena',
    };

    const prompt = [
      `Plato: "${input.title}" (${slotLabel[input.slot] ?? input.slot}).`,
      'Devuelve en español neutro:',
      '1. "ingredients": entre 3 y 7 ingredientes con nombre, cantidad (qty), unidad (unit) y categoría (category).',
      '   Ejemplos de unidades: "g", "ml", "cda", "cdta", "taza", "unidad".',
      '2. "instructions": pasos de preparación numerados (entre 3 y 6 pasos), claros y concisos.',
      '   Ejemplo: "1. Cocina la avena con leche a fuego medio. 2. Agrega frutas y miel. 3. Sirve caliente."',
    ].join('\n');

    let raw: string;
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_schema', json_schema: DETAILS_JSON_SCHEMA },
        messages: [
          { role: 'system', content: 'Eres un chef nutricionista. Responde SIEMPRE en español neutro. Devuelve únicamente JSON válido.' },
          { role: 'user', content: prompt },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? '{}';
    } catch (e: any) {
      throw new InternalServerErrorException(`Error al contactar OpenAI: ${e?.message ?? e}`);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new InternalServerErrorException('OpenAI devolvió JSON inválido al generar detalles de comida.');
    }

    const validated = MealDetailsSchema.safeParse(parsed);
    if (!validated.success) {
      throw new InternalServerErrorException(
        `Respuesta de OpenAI no cumple el schema esperado: ${validated.error.message}`,
      );
    }

    return validated.data;
  }
}
