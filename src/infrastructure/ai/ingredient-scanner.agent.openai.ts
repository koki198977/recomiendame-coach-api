import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import {
  IngredientScannerAgentPort,
  UserContext,
} from '../../core/application/ingredient-scanner/ports/out.ingredient-scanner-agent.port';
import { ScanAndSuggestResult } from '../../core/application/ingredient-scanner/dto/dish-suggestion.dto';

@Injectable()
export class OpenAIIngredientScannerAgent implements IngredientScannerAgentPort {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 40000),
  });

  private model = process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o';

  async scanAndSuggest(params: {
    imagesBase64: string[];
    userContext: UserContext;
  }): Promise<ScanAndSuggestResult> {
    const { imagesBase64, userContext } = params;

    // ── Paso 1: Identificar ingredientes de todas las imágenes ──────────────
    const identificationPrompt = `Analiza ${imagesBase64.length > 1 ? `estas ${imagesBase64.length} imágenes (pueden mostrar distintas partes del mismo espacio o distintos ingredientes)` : 'esta imagen'} y extrae la lista COMPLETA de ingredientes alimenticios visibles en todas ellas.

Combina los ingredientes de todas las imágenes en una sola lista sin duplicados.

Responde SOLO en JSON con este formato exacto:
{
  "ingredients": [
    { "name": "pollo", "category": "proteina", "quantity_estimate": "300g aprox" },
    { "name": "brocoli", "category": "verdura", "quantity_estimate": "1 cabeza" }
  ],
  "confidence": "alta|media|baja",
  "notes": "opcional — si hay algo ambiguo"
}

No incluyas utensilios, envases vacíos ni elementos no comestibles.`;

    // Construir el array de content con todas las imágenes + el prompt
    const imageContents: OpenAI.Chat.ChatCompletionContentPart[] = imagesBase64.map((b64) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/jpeg;base64,${b64}`,
        detail: 'low' as const, // low para reducir tokens
      },
    }));

    let identificationRaw: string;
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              ...imageContents,
              { type: 'text', text: identificationPrompt },
            ],
          },
        ],
      });
      identificationRaw = completion.choices[0]?.message?.content ?? '{}';
    } catch (e: any) {
      throw new InternalServerErrorException(`Error al analizar imágenes: ${e?.message ?? e}`);
    }

    let identificationResult: any;
    try {
      identificationResult = JSON.parse(identificationRaw);
    } catch {
      throw new InternalServerErrorException('La IA devolvió JSON inválido al identificar ingredientes.');
    }

    const ingredients = identificationResult.ingredients ?? [];
    if (ingredients.length === 0) {
      return {
        ingredients: [],
        confidence: identificationResult.confidence ?? 'baja',
        notes: identificationResult.notes,
        dishes: [],
      };
    }

    // ── Paso 2: Sugerir platos con los ingredientes detectados ──────────────
    const goalLabels: Record<string, string> = {
      LOSE_WEIGHT: 'perder peso',
      GAIN_WEIGHT: 'ganar peso',
      MAINTAIN_WEIGHT: 'mantener peso',
      GAIN_MUSCLE: 'ganar músculo',
      IMPROVE_HEALTH: 'mejorar salud general',
    };

    const dishPrompt = `Eres Chapix, el coach nutricional de Recomiéndame.
El usuario tiene disponibles estos ingredientes: ${JSON.stringify(ingredients.map((i: any) => i.name))}

Perfil del usuario:
- Objetivo: ${goalLabels[userContext.goal] ?? userContext.goal}
- Target diario: ${userContext.caloriesTarget} kcal
- Calorías ya consumidas hoy: ${userContext.todayConsumed} kcal
- Alergias: ${userContext.allergies ?? 'ninguna'}

Sugiere exactamente 3 platos que pueda preparar con estos ingredientes.
Para cada plato DEBES incluir:
- "steps": array con MÍNIMO 4 pasos detallados de preparación (cómo cocinar el plato paso a paso, con tiempos y técnicas)
- "how_to_cook": string con un resumen narrativo de la preparación completa (2-4 oraciones)

Responde SOLO en JSON:
{
  "dishes": [
    {
      "name": "Pollo al limón con brócoli",
      "prep_time_minutes": 20,
      "macros": { "kcal": 480, "protein": 42, "carbs": 35, "fat": 12 },
      "compatibility": "Perfecto para tu objetivo de ganar músculo",
      "ingredients_used": ["pollo", "brocoli", "limon"],
      "steps": [
        "Cortar el pollo en trozos medianos y salpimentar.",
        "Calentar una sartén con aceite a fuego medio-alto.",
        "Dorar el pollo 5 minutos por cada lado hasta que esté cocido.",
        "Agregar el brócoli en floretes y saltear 3 minutos.",
        "Exprimir el limón sobre todo y servir caliente."
      ],
      "how_to_cook": "Saltea el pollo en aceite caliente hasta dorarlo, luego incorpora el brócoli y termina con jugo de limón. Listo en 20 minutos.",
      "chapix_note": "Este plato te deja 320 kcal para la cena, ideal."
    }
  ]
}`;

    let dishesRaw: string;
    try {
      const completion = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Eres Chapix, coach nutricional. Responde SIEMPRE en español neutro. Devuelve únicamente JSON válido.',
          },
          { role: 'user', content: dishPrompt },
        ],
      });
      dishesRaw = completion.choices[0]?.message?.content ?? '{}';
    } catch (e: any) {
      throw new InternalServerErrorException(`Error al generar sugerencias de platos: ${e?.message ?? e}`);
    }

    let dishesResult: any;
    try {
      dishesResult = JSON.parse(dishesRaw);
    } catch {
      throw new InternalServerErrorException('La IA devolvió JSON inválido al sugerir platos.');
    }

    return {
      ingredients: identificationResult.ingredients ?? [],
      confidence: identificationResult.confidence ?? 'media',
      notes: identificationResult.notes,
      dishes: dishesResult.dishes ?? [],
    };
  }
}
