import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { ChapiAgentPort } from '../../core/application/chapi/ports/out.chapi-agent.port';
import { ChapiResponse } from '../../core/domain/chapi/entities';

const ChapiActionSchema = z.object({
  title: z.string(),
  type: z.enum(['PHYSICAL', 'MENTAL', 'BREATHING', 'OTHER']),
  durationMinutes: z.number(),
});

const ChapiResponseSchema = z.object({
  emotion: z.string(),
  neuroscience: z.string(),
  actions: z.array(ChapiActionSchema).min(1).max(3),
  miniTask: z.string().optional(),
});

@Injectable()
export class OpenAIChapiAgent implements ChapiAgentPort {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 30000),
  });

  private model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  async analyzeMood({
    userId,
    message,
    userProfile,
  }: {
    userId: string;
    message: string;
    userProfile: any;
  }): Promise<ChapiResponse> {
    try {
      const system = `Eres "Chapi Mind", un agente de acompañamiento emocional y fitness.
      Tu misión es conectar el estado emocional con la biología (neurociencia simple) y dar soluciones prácticas inmediatas.
      
      IMPORTANTE: Responde SIEMPRE en ESPAÑOL. Traduce TODOS los términos técnicos al español.
      
      VARIEDAD: Sé creativo y varía tus respuestas. No repitas siempre las mismas acciones. Adapta tus sugerencias al contexto específico del mensaje del usuario y su perfil. Si menciona trabajo, enfócate en técnicas que pueda hacer en la oficina; si menciona familia, ajusta al contexto doméstico.
      
      TONO: Empático, científico pero simple, motivador, directo.
      
      PASOS:
      1. Clasifica la emoción (ej: Tristeza, Ansiedad, Burnout, Cansancio, Ira).
      2. Explica la neurociencia brevemente (ej: "Bajón de dopamina", "Cortisol alto").
      3. Sugiere 2-3 acciones inmediatas (micro-hábitos) para cambiar la química cerebral.
      4. Propón una "mini-tarea" de gamificación.
      
      EJEMPLOS DE ACCIONES (en español) - usa estas como inspiración, pero VARÍA según el contexto:
      - 10 min de sol (Vit D / Serotonina)
      - Ducha fría (Noradrenalina)
      - Respiración cuadrada 4-4-4-4 (Bajar cortisol)
      - Caminata rápida de 5 min (Endorfinas)
      - 3 minutos de ejercicio ligero
      - Escuchar música energizante
      - Hablar con un amigo 5 min
      - Estiramiento de 2 minutos
      - Tomar agua fría
      - Saltar en el lugar 1 minuto
      
      Responde SIEMPRE en JSON válido con la siguiente estructura exacta:
      {
        "emotion": "string (nombre de la emoción)",
        "neuroscience": "string (explicación científica simple)",
        "actions": [
          {
            "title": "string (nombre de la acción)",
            "type": "PHYSICAL" | "MENTAL" | "BREATHING" | "OTHER",
            "durationMinutes": number
          }
        ],
        "miniTask": "string (tarea opcional de gamificación)"
      }`;

      const conditions = userProfile.conditions?.map((c: any) => c.label).join(', ') || 'Ninguna';
      const goal = userProfile.goal?.goalType || 'General';
      
      const userPrompt = `
      Usuario: "${message}"
      
      === PERFIL DEL USUARIO ===
      - Peso: ${userProfile.weightKg || 'N/A'} kg
      - Altura: ${userProfile.heightCm || 'N/A'} cm
      - Nivel Actividad: ${userProfile.activityLevel || 'N/A'}
      - Objetivo: ${goal}
      - Condiciones de Salud: ${conditions}
      - Sexo: ${userProfile.sex || 'N/A'}
      ==========================

      Usa este perfil para personalizar tu respuesta. Por ejemplo, si tiene diabetes, tenlo en cuenta en las recomendaciones. Si su objetivo es perder peso, ajusta los consejos.
      
      Genera la respuesta JSON.
      `;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.85,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const json = this.sanitizeToJson(raw);
      const parsed = ChapiResponseSchema.safeParse(JSON.parse(json));

      if (!parsed.success) {
        throw new Error(`Error validación JSON Chapi: ${parsed.error.message}`);
      }

      return parsed.data as ChapiResponse;
    } catch (e: any) {
      throw new InternalServerErrorException(`ChapiAgent error: ${e.message}`);
    }
  }

  private sanitizeToJson(raw: string): string {
    const cleaned = raw.replace(/```json|```/g, '');
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first === -1 || last === -1 || last < first) return cleaned.trim();
    return cleaned.slice(first, last + 1).trim();
  }
}
