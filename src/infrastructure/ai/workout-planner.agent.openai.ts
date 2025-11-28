import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { WorkoutPlannerAgentPort } from '../../core/application/workouts/ports/out.workout-planner-agent.port';
import { WorkoutDay } from '../../core/domain/workouts/entities';

// Zod Schemas
const ExerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int().optional(),
  reps: z.string().optional(), // "10-12", "AMRAP", "5"
  weight: z.string().optional(), // "RPE 8", "70%"
  rpe: z.number().int().optional(),
  restSeconds: z.number().int().optional(),
  notes: z.string().optional(),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
  instructions: z.string().optional(), // Paso a paso
  videoQuery: z.string().optional(), // Término de búsqueda para video
});

const DayResponseSchema = z.object({
  dayIndex: z.number().int().min(1).max(7),
  exercises: z.array(ExerciseSchema).min(3),
});

const WeekResponseSchema = z.object({
  notes: z.string().optional(),
  days: z.array(DayResponseSchema).min(1).max(7),
});

@Injectable()
export class OpenAIWorkoutPlannerAgent implements WorkoutPlannerAgentPort {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 30000),
  });

  private model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  async draftWeekWorkoutPlan({
    userId,
    weekStart,
    userProfile,
    goal,
    daysAvailable,
  }: {
    userId: string;
    weekStart: Date;
    userProfile: any;
    goal: string;
    daysAvailable: number;
  }): Promise<{ days: WorkoutDay[]; notes?: string }> {
    try {
      const system = `Eres un entrenador personal experto (Coach de Gym).
      Tu objetivo es crear una rutina semanal de gimnasio personalizada.
      Responde SIEMPRE en español neutro.
      Devuelve únicamente JSON válido (sin bloques de código ni explicaciones).
      El formato de respuesta debe cumplir estrictamente con el esquema solicitado.`;

      const userPrompt = `
      Genera una rutina de entrenamiento para la semana del ${weekStart.toISOString().split('T')[0]}.
      
      **Perfil del Usuario:**
      - Objetivo: ${goal}
      - Días disponibles para entrenar: ${daysAvailable}
      - Nivel de experiencia: ${userProfile?.experienceLevel ?? 'Intermedio'}
      - Lesiones/Limitaciones: ${userProfile?.injuries ?? 'Ninguna'}
      
      **Requisitos:**
      - Genera exactamente ${daysAvailable} días de entrenamiento.
      - Distribuye los días lógicamente (ej: Lunes, Martes, Jueves, Viernes).
      - Incluye ejercicios compuestos y de aislamiento según el objetivo.
      - Especifica series, repeticiones (rango), y descanso sugerido.
      - **VISUALIZACIÓN:** Para cada ejercicio, incluye:
        - "muscleGroup": Músculo principal (ej: "Pectoral", "Cuádriceps").
        - "equipment": Qué se necesita (ej: "Barra", "Mancuernas", "Máquina").
        - "instructions": Breve explicación paso a paso de la técnica correcta.
        - "videoQuery": Término de búsqueda preciso para encontrar un video tutorial en YouTube (ej: "sentadilla barra alta tecnica").
      
      **Formato JSON esperado:**
      {
        "notes": "Breve consejo o foco para la semana",
        "days": [
          {
            "dayIndex": 1, // 1=Lunes, 7=Domingo
            "exercises": [
              { 
                "name": "Sentadilla con barra", 
                "sets": 4, 
                "reps": "6-8", 
                "rpe": 8, 
                "restSeconds": 180, 
                "notes": "Bajar profundo",
                "muscleGroup": "Cuádriceps",
                "equipment": "Barra, Rack",
                "instructions": "1. Coloca la barra en los trapecios. 2. Pies ancho de hombros. 3. Baja controlando...",
                "videoQuery": "sentadilla barra tecnica"
              },
              ...
            ]
          },
          ...
        ]
      }
      `;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const json = this.sanitizeToJson(raw);
      const parsed = WeekResponseSchema.safeParse(JSON.parse(json));

      if (!parsed.success) {
        throw new Error(`Error validación JSON Workout: ${parsed.error.message}`);
      }

      const days: WorkoutDay[] = parsed.data.days.map((d) => ({
        dayIndex: d.dayIndex,
        exercises: d.exercises.map((e, idx) => ({
          ...e,
          order: idx,
          videoQuery: e.videoQuery,
        })),
      }));

      return { days, notes: parsed.data.notes };
    } catch (e: any) {
      throw new InternalServerErrorException(`WorkoutPlannerAgent error: ${e.message}`);
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
