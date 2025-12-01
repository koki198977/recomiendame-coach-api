import { Injectable, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AnalyzeMealImageUseCase {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 30000),
  });

  async execute(imageUrl: string, userDescription?: string) {
    try {
      const prompt = userDescription
        ? `Analiza esta imagen de comida. El usuario describe: "${userDescription}".
        
Estima los valores nutricionales totales del plato completo.

Devuelve SOLO un JSON con este formato exacto:
{
  "title": "Nombre descriptivo del plato",
  "kcal": número_entero,
  "protein_g": número_entero,
  "carbs_g": número_entero,
  "fat_g": número_entero,
  "confidence": "high" | "medium" | "low",
  "notes": "Breve descripción de lo que ves y cómo estimaste los valores"
}

Sé realista con las porciones. Si no estás seguro, indica confidence: "low".`
        : `Analiza esta imagen de comida y estima los valores nutricionales totales del plato.

Devuelve SOLO un JSON con este formato exacto:
{
  "title": "Nombre descriptivo del plato",
  "kcal": número_entero,
  "protein_g": número_entero,
  "carbs_g": número_entero,
  "fat_g": número_entero,
  "confidence": "high" | "medium" | "low",
  "notes": "Breve descripción de lo que ves y cómo estimaste los valores"
}

Sé realista con las porciones. Si no estás seguro, indica confidence: "low".`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Eres un nutricionista experto. Analiza imágenes de comida y estima valores nutricionales de forma precisa y realista.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const result = JSON.parse(raw);

      // Validar que tenga los campos necesarios
      if (!result.title || !result.kcal || !result.protein_g || !result.carbs_g || !result.fat_g) {
        throw new Error('Respuesta incompleta de la IA');
      }

      return {
        title: result.title,
        kcal: Math.round(result.kcal),
        protein_g: Math.round(result.protein_g),
        carbs_g: Math.round(result.carbs_g),
        fat_g: Math.round(result.fat_g),
        confidence: result.confidence || 'medium',
        notes: result.notes || '',
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Error al analizar la imagen: ${error.message}`
      );
    }
  }
}
