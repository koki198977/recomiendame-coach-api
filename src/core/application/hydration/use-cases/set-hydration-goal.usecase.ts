import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { HYDRATION_REPO, HydrationRepoPort } from '../ports/out.hydration-repo.port';
import { HYDRATION_ANALYZER, HydrationAnalyzerPort } from '../ports/out.hydration-analyzer.port';
import { HydrationGoal } from '../../../domain/hydration/entities';

export interface SetHydrationGoalInput {
  userId: string;
  dailyTargetMl?: number;
  reminderIntervalMinutes?: number;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  autoCalculate?: boolean; // Si true, calcula automáticamente basado en perfil
}

export interface SetHydrationGoalOutput {
  goal: HydrationGoal;
  message: string;
  recommendations: string[];
}

@Injectable()
export class SetHydrationGoalUseCase {
  constructor(
    @Inject(HYDRATION_REPO) private readonly hydrationRepo: HydrationRepoPort,
    @Inject(HYDRATION_ANALYZER) private readonly analyzer: HydrationAnalyzerPort,
  ) {}

  async execute(input: SetHydrationGoalInput): Promise<Result<SetHydrationGoalOutput>> {
    try {
      const { userId, autoCalculate = false } = input;

      let dailyTargetMl = input.dailyTargetMl;

      // Auto-calcular objetivo si se solicita
      if (autoCalculate || !dailyTargetMl) {
        dailyTargetMl = await this.analyzer.calculateOptimalGoal({
          userId,
          // Aquí podrías obtener datos del perfil del usuario
          weightKg: 70, // Por defecto, idealmente obtener del perfil
          activityLevel: 'MODERATE',
          climate: 'MODERATE',
        });
      }

      // Validaciones
      if (!dailyTargetMl || dailyTargetMl < 1000 || dailyTargetMl > 8000) {
        return err(new Error('El objetivo debe estar entre 1000ml y 8000ml'));
      }

      // Crear objetivo con valores por defecto
      const goal: HydrationGoal = {
        userId,
        dailyTargetMl,
        reminderIntervalMinutes: input.reminderIntervalMinutes || 120, // 2 horas por defecto
        startTime: input.startTime || '07:00',
        endTime: input.endTime || '22:00',
        isActive: input.isActive !== undefined ? input.isActive : true,
      };

      // Guardar objetivo
      const savedGoal = await this.hydrationRepo.setGoal(goal);

      // Generar mensaje
      const message = this.generateGoalMessage(savedGoal, autoCalculate);

      // Generar recomendaciones
      const recommendations = this.generateGoalRecommendations(savedGoal);

      return ok({
        goal: savedGoal,
        message,
        recommendations,
      });
    } catch (error) {
      return err(error);
    }
  }

  private generateGoalMessage(goal: HydrationGoal, autoCalculated: boolean): string {
    const liters = (goal.dailyTargetMl / 1000).toFixed(1);
    
    if (autoCalculated) {
      return `🎯 He calculado tu objetivo personalizado: ${liters}L diarios. ¡Perfecto para tu perfil!`;
    } else {
      return `✅ Objetivo establecido: ${liters}L diarios. ¡Vamos a alcanzarlo juntos!`;
    }
  }

  private generateGoalRecommendations(goal: HydrationGoal): string[] {
    const recommendations: string[] = [];
    const liters = goal.dailyTargetMl / 1000;

    // Recomendaciones basadas en la cantidad
    if (goal.dailyTargetMl >= 3000) {
      recommendations.push('💪 Objetivo ambicioso. Distribuye la ingesta durante todo el día');
      recommendations.push('⚠️ Evita tomar grandes cantidades de una vez');
    } else if (goal.dailyTargetMl <= 1500) {
      recommendations.push('🌱 Buen inicio. Considera aumentar gradualmente tu objetivo');
    } else {
      recommendations.push('👍 Objetivo equilibrado y saludable');
    }

    // Recomendaciones basadas en recordatorios
    if (goal.reminderIntervalMinutes <= 60) {
      recommendations.push('🔔 Recordatorios frecuentes te ayudarán a crear el hábito');
    } else if (goal.reminderIntervalMinutes >= 180) {
      recommendations.push('⏰ Considera recordatorios más frecuentes para mejores resultados');
    }

    // Recomendaciones de horario
    const startHour = parseInt(goal.startTime.split(':')[0]);
    const endHour = parseInt(goal.endTime.split(':')[0]);
    
    if (startHour >= 8) {
      recommendations.push('🌅 Intenta comenzar más temprano para mejor distribución');
    }
    
    if (endHour <= 20) {
      recommendations.push('🌙 Puedes extender hasta más tarde si es necesario');
    }

    // Consejos generales
    recommendations.push('💡 Tip: Toma un vaso al despertar para activar tu metabolismo');
    recommendations.push('🍽️ Acompaña cada comida con agua para crear rutina');

    return recommendations.slice(0, 4); // Máximo 4 recomendaciones
  }
}