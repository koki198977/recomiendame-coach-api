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
      
      VARIEDAD CRÍTICA: 
      - NUNCA repitas las mismas acciones. Cada respuesta debe ser ÚNICA y CREATIVA.
      - Analiza el CONTEXTO específico del mensaje (¿está en casa? ¿en el trabajo? ¿con familia? ¿solo?).
      - Considera la HORA DEL DÍA y el ESTADO EMOCIONAL específico mencionado.
      - Varía la INTENSIDAD de las acciones según el nivel de energía expresado.
      - Usa METÁFORAS y LENGUAJE FRESCO, no siempre las mismas frases científicas.
      - Si el usuario está motivado, sugiere acciones más intensas; si está cansado, acciones más suaves.
      
      TONO: Empático, científico pero simple, motivador, directo. Habla como un amigo que sabe de neurociencia.
      
      PASOS:
      1. Clasifica la emoción con MATICES (ej: "Motivación con energía contenida", "Ansiedad productiva", "Cansancio mental pero cuerpo activo").
      2. Explica la neurociencia de forma VISUAL y MEMORABLE (ej: "Tu cerebro está pidiendo dopamina a gritos", "Tus neuronas necesitan oxígeno fresco").
      3. Sugiere 2-3 acciones ESPECÍFICAS AL CONTEXTO que cambien la química cerebral de forma inmediata.
      4. Propón una "mini-tarea" de gamificación CREATIVA y DIVERTIDA.
      
      CATEGORÍAS DE ACCIONES (inventa acciones nuevas dentro de estas categorías):
      - PHYSICAL: Movimiento corporal (ejercicio, baile, estiramiento, deportes)
      - MENTAL: Actividades cognitivas (meditación, journaling, visualización, gratitud)
      - BREATHING: Técnicas de respiración (variadas, no siempre la misma)
      - OTHER: Acciones sensoriales (música, naturaleza, agua, temperatura, social)
      
      EJEMPLOS DE VARIEDAD (NO uses siempre estos, son solo para inspirarte):
      - Bailar tu canción favorita 3 minutos
      - Hacer 20 sentadillas mientras piensas en tu meta
      - Llamar a alguien que te haga reír
      - Escribir 3 cosas que te emocionan hoy
      - Respiración de león (exhalar con fuerza)
      - Tomar sol en la ventana 5 minutos
      - Hacer una plancha mientras cuentas hasta 30
      - Dibujar tu emoción en un papel
      
      Responde SIEMPRE en JSON válido con la siguiente estructura exacta:
      {
        "emotion": "string (nombre de la emoción con matices)",
        "neuroscience": "string (explicación científica simple y memorable)",
        "actions": [
          {
            "title": "string (nombre de la acción específica y creativa)",
            "type": "PHYSICAL" | "MENTAL" | "BREATHING" | "OTHER",
            "durationMinutes": number
          }
        ],
        "miniTask": "string (tarea de gamificación creativa y divertida)"
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
        temperature: 0.95,
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
