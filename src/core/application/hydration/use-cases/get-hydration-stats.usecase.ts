import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { HYDRATION_REPO, HydrationRepoPort } from '../ports/out.hydration-repo.port';
import { HYDRATION_ANALYZER, HydrationAnalyzerPort } from '../ports/out.hydration-analyzer.port';
import { HydrationAnalysis, HydrationPattern, HydrationGoal } from '../../../domain/hydration/entities';

export interface GetHydrationStatsInput {
  userId: string;
  period?: 'TODAY' | 'WEEK' | 'MONTH';
  date?: Date;
}

export interface GetHydrationStatsOutput {
  dailyAnalysis: HydrationAnalysis;
  pattern: HydrationPattern;
  goal: HydrationGoal | null;
  weeklyData: Array<{ date: Date; ml: number; percentage: number }>;
  recommendations: string[];
  nextReminder?: {
    scheduledFor: Date;
    message: string;
    ml: number;
  };
}

@Injectable()
export class GetHydrationStatsUseCase {
  constructor(
    @Inject(HYDRATION_REPO) private readonly hydrationRepo: HydrationRepoPort,
    @Inject(HYDRATION_ANALYZER) private readonly analyzer: HydrationAnalyzerPort,
  ) {}

  async execute(input: GetHydrationStatsInput): Promise<Result<GetHydrationStatsOutput>> {
    try {
      const { userId, date = new Date() } = input;

      // Obtener análisis paralelos
      const [dailyAnalysis, pattern, goal] = await Promise.all([
        this.analyzer.analyzeDailyHydration({ userId, date }),
        this.analyzer.analyzeHydrationPattern({ userId, days: 30 }),
        this.hydrationRepo.getGoal(userId),
      ]);

      // Obtener datos semanales
      const weekStart = this.getWeekStart(date);
      const weeklyStats = await this.hydrationRepo.getWeeklyStats(userId, weekStart);
      
      const weeklyData = weeklyStats.map(stat => ({
        date: stat.date,
        ml: stat.ml,
        percentage: Math.round((stat.ml / (goal?.dailyTargetMl || 2000)) * 100),
      }));

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(dailyAnalysis, pattern, goal);

      // Calcular próximo recordatorio
      const nextReminder = this.calculateNextReminder(dailyAnalysis, goal);

      return ok({
        dailyAnalysis,
        pattern,
        goal,
        weeklyData,
        recommendations,
        nextReminder,
      });
    } catch (error) {
      return err(error);
    }
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private generateRecommendations(
    analysis: HydrationAnalysis,
    pattern: HydrationPattern,
    goal: HydrationGoal | null
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en el análisis diario
    if (analysis.status === 'POOR') {
      recommendations.push('🚨 Prioridad: Aumenta tu ingesta de agua inmediatamente');
      recommendations.push('💧 Toma un vaso de agua cada hora hasta alcanzar tu objetivo');
    } else if (analysis.status === 'NEEDS_IMPROVEMENT') {
      recommendations.push('⚡ Acelera el ritmo: toma agua más frecuentemente');
      recommendations.push('📱 Configura recordatorios cada 2 horas');
    } else if (analysis.status === 'EXCELLENT') {
      recommendations.push('🎉 ¡Perfecto! Mantén este excelente hábito');
    }

    // Recomendaciones basadas en patrones
    if (pattern.consistency === 'POOR') {
      recommendations.push('📈 Mejora tu consistencia: establece una rutina diaria');
      recommendations.push('🔔 Usa recordatorios automáticos para crear el hábito');
    }

    if (pattern.streak === 0) {
      recommendations.push('🎯 Comienza una nueva racha: alcanza tu objetivo hoy');
    } else if (pattern.streak >= 7) {
      recommendations.push(`🔥 ¡Increíble racha de ${pattern.streak} días! No la rompas`);
    }

    // Recomendaciones basadas en horas pico
    if (pattern.peakHours.length > 0) {
      recommendations.push(`⏰ Tus mejores horas son: ${pattern.peakHours.join(', ')}`);
    }

    // Recomendaciones de objetivo
    if (!goal) {
      recommendations.push('🎯 Establece un objetivo personalizado de hidratación');
    } else if (goal.dailyTargetMl < 1500) {
      recommendations.push('📊 Considera aumentar tu objetivo diario de hidratación');
    }

    return recommendations.slice(0, 5); // Máximo 5 recomendaciones
  }

  private calculateNextReminder(
    analysis: HydrationAnalysis,
    goal: HydrationGoal | null
  ): { scheduledFor: Date; message: string; ml: number } | undefined {
    if (!goal || !goal.isActive) return undefined;

    const now = new Date();
    const currentHour = now.getHours();
    
    // No recordatorios fuera del horario activo
    const startHour = parseInt(goal.startTime.split(':')[0]);
    const endHour = parseInt(goal.endTime.split(':')[0]);
    
    if (currentHour < startHour || currentHour >= endHour) {
      return undefined;
    }

    // Calcular próximo recordatorio
    const nextReminderTime = new Date(now);
    nextReminderTime.setMinutes(now.getMinutes() + goal.reminderIntervalMinutes);

    // Cantidad sugerida basada en el déficit
    const suggestedMl = Math.min(300, Math.max(150, analysis.recommendedNextIntake));

    // Mensaje personalizado según el estado
    let message: string;
    if (analysis.status === 'POOR') {
      message = `💧 ¡Hora de hidratarte! Te faltan ${analysis.remainingMl}ml para hoy`;
    } else if (analysis.status === 'NEEDS_IMPROVEMENT') {
      message = `🌊 Recordatorio de hidratación: ${suggestedMl}ml te acercan a tu objetivo`;
    } else {
      message = `✨ ¡Vas excelente! Mantén el ritmo con ${suggestedMl}ml más`;
    }

    return {
      scheduledFor: nextReminderTime,
      message,
      ml: suggestedMl,
    };
  }
}