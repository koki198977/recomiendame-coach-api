import { Injectable } from '@nestjs/common';
import { HydrationAnalyzerPort } from '../../core/application/hydration/ports/out.hydration-analyzer.port';
import { HydrationRepoPort, HYDRATION_REPO } from '../../core/application/hydration/ports/out.hydration-repo.port';
import { HydrationAnalysis, HydrationPattern, HydrationNotification } from '../../core/domain/hydration/entities';
import { Inject } from '@nestjs/common';

@Injectable()
export class HydrationAnalyzerService implements HydrationAnalyzerPort {
  constructor(
    @Inject(HYDRATION_REPO) private readonly hydrationRepo: HydrationRepoPort,
  ) {}

  async analyzeDailyHydration(params: {
    userId: string;
    date?: Date;
  }): Promise<HydrationAnalysis> {
    const { userId, date = new Date() } = params;

    // Obtener objetivo del usuario
    const goal = await this.hydrationRepo.getGoal(userId);
    const targetMl = goal?.dailyTargetMl || this.getDefaultGoal();

    // Obtener logs del día
    const totalMl = await this.hydrationRepo.getTotalByDate(userId, date);

    // Calcular métricas
    const achievementPercentage = Math.round((totalMl / targetMl) * 100);
    const remainingMl = Math.max(0, targetMl - totalMl);
    
    // Calcular promedio por hora (asumiendo 16 horas activas)
    const activeHours = 16;
    const averagePerHour = totalMl / activeHours;

    // Determinar estado
    const status = this.determineHydrationStatus(achievementPercentage);

    // Calcular próxima ingesta recomendada
    const recommendedNextIntake = this.calculateNextIntake(remainingMl, date);

    // Generar insights
    const insights = this.generateDailyInsights(totalMl, targetMl, achievementPercentage, date);

    return {
      userId,
      date,
      totalMl,
      targetMl,
      achievementPercentage,
      status,
      remainingMl,
      averagePerHour,
      recommendedNextIntake,
      insights,
    };
  }

  async analyzeHydrationPattern(params: {
    userId: string;
    days?: number;
  }): Promise<HydrationPattern> {
    const { userId, days = 30 } = params;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.hydrationRepo.getLogsByUser(userId, startDate, endDate);
    const goal = await this.hydrationRepo.getGoal(userId);
    const targetMl = goal?.dailyTargetMl || this.getDefaultGoal();

    // Agrupar por día
    const dailyTotals = this.groupLogsByDay(logs);
    const dailyValues = Array.from(dailyTotals.values());

    // Calcular estadísticas
    const weeklyAverage = dailyValues.reduce((sum, ml) => sum + ml, 0) / Math.max(dailyValues.length, 1);

    const bestDay = this.findBestDay(dailyTotals);
    const worstDay = this.findWorstDay(dailyTotals);

    // Calcular consistencia
    const consistency = this.calculateConsistency(dailyValues, targetMl);

    // Calcular racha actual
    const streak = this.calculateCurrentStreak(dailyTotals, targetMl);

    // Días perdidos
    const missedDays = this.calculateMissedDays(dailyTotals, targetMl, days);

    // Horas pico (simplificado)
    const peakHours = this.calculatePeakHours(logs);

    return {
      userId,
      weeklyAverage,
      bestDay,
      worstDay,
      consistency,
      streak,
      missedDays,
      peakHours,
    };
  }

  async generateHydrationNotifications(params: {
    userId: string;
  }): Promise<HydrationNotification[]> {
    const { userId } = params;
    const notifications: HydrationNotification[] = [];

    // Análisis del día actual
    const dailyAnalysis = await this.analyzeDailyHydration({ userId });
    const pattern = await this.analyzeHydrationPattern({ userId, days: 7 });

    // Notificación por deshidratación
    if (dailyAnalysis.status === 'POOR') {
      notifications.push({
        userId,
        type: 'DEHYDRATION_RISK',
        title: '💧 ¡Riesgo de deshidratación!',
        body: `Solo has tomado ${dailyAnalysis.totalMl}ml hoy (${dailyAnalysis.achievementPercentage}% de tu objetivo). Tu cuerpo necesita agua.`,
        data: { analysis: dailyAnalysis },
        priority: 'HIGH',
        actionButtons: [
          { id: 'log_water', label: 'Registrar Agua', action: 'LOG_WATER', data: { ml: 250 } },
          { id: 'set_reminder', label: 'Recordatorio', action: 'SET_REMINDER' }
        ]
      });
    }

    // Notificación por objetivo alcanzado
    if (dailyAnalysis.achievementPercentage >= 100 && dailyAnalysis.achievementPercentage <= 110) {
      notifications.push({
        userId,
        type: 'GOAL_ACHIEVED',
        title: '🎉 ¡Objetivo de hidratación alcanzado!',
        body: `¡Excelente! Has tomado ${dailyAnalysis.totalMl}ml hoy. Tu cuerpo te lo agradece.`,
        data: { analysis: dailyAnalysis },
        priority: 'LOW',
        actionButtons: [
          { id: 'view_stats', label: 'Ver Estadísticas', action: 'VIEW_STATS' }
        ]
      });
    }

    // Notificación por racha
    if (pattern.streak >= 7) {
      notifications.push({
        userId,
        type: 'STREAK_MILESTONE',
        title: '🔥 ¡Racha de hidratación!',
        body: `¡Increíble! Llevas ${pattern.streak} días consecutivos alcanzando tu objetivo de hidratación.`,
        data: { streak: pattern.streak },
        priority: 'MEDIUM',
      });
    }

    // Notificación de aliento por mal patrón
    if (pattern.consistency === 'POOR' && pattern.missedDays > 3) {
      notifications.push({
        userId,
        type: 'ENCOURAGEMENT',
        title: '💪 ¡No te rindas con la hidratación!',
        body: `Has tenido ${pattern.missedDays} días por debajo del objetivo esta semana. Pequeños sorbos hacen la diferencia.`,
        data: { pattern },
        priority: 'MEDIUM',
        actionButtons: [
          { id: 'adjust_goal', label: 'Ajustar Objetivo', action: 'ADJUST_GOAL' },
          { id: 'set_reminder', label: 'Más Recordatorios', action: 'SET_REMINDER' }
        ]
      });
    }

    return notifications;
  }

  async calculateOptimalGoal(params: {
    userId: string;
    weightKg?: number;
    activityLevel?: string;
    climate?: 'HOT' | 'MODERATE' | 'COLD';
  }): Promise<number> {
    const { weightKg = 70, activityLevel = 'MODERATE', climate = 'MODERATE' } = params;

    // Fórmula base: 35ml por kg de peso corporal
    let baseMl = weightKg * 35;

    // Ajuste por nivel de actividad
    const activityMultiplier = {
      'SEDENTARY': 1.0,
      'LIGHT': 1.1,
      'MODERATE': 1.2,
      'ACTIVE': 1.3,
      'VERY_ACTIVE': 1.4,
    };

    baseMl *= activityMultiplier[activityLevel as keyof typeof activityMultiplier] || 1.2;

    // Ajuste por clima
    const climateMultiplier = {
      'COLD': 1.0,
      'MODERATE': 1.1,
      'HOT': 1.3,
    };

    baseMl *= climateMultiplier[climate];

    // Redondear a múltiplos de 250ml
    return Math.round(baseMl / 250) * 250;
  }

  async predictDehydrationRisk(params: {
    userId: string;
    currentTime?: Date;
  }): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    hoursUntilDehydration: number;
    recommendedAction: string;
  }> {
    const { userId, currentTime = new Date() } = params;

    const analysis = await this.analyzeDailyHydration({ userId, date: currentTime });
    const goal = await this.hydrationRepo.getGoal(userId);

    const currentHour = currentTime.getHours();
    const hoursRemaining = 22 - currentHour; // Asumiendo que se duerme a las 22:00
    
    const expectedMlByNow = this.calculateExpectedIntakeByHour(
      goal?.dailyTargetMl || this.getDefaultGoal(),
      currentHour
    );

    const deficit = expectedMlByNow - analysis.totalMl;
    const deficitPercentage = (deficit / expectedMlByNow) * 100;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    let hoursUntilDehydration: number;
    let recommendedAction: string;

    if (deficitPercentage <= 10) {
      riskLevel = 'LOW';
      hoursUntilDehydration = hoursRemaining;
      recommendedAction = 'Continúa con tu ritmo actual de hidratación';
    } else if (deficitPercentage <= 30) {
      riskLevel = 'MEDIUM';
      hoursUntilDehydration = Math.max(4, hoursRemaining - 2);
      recommendedAction = 'Toma un vaso de agua en la próxima hora';
    } else if (deficitPercentage <= 50) {
      riskLevel = 'HIGH';
      hoursUntilDehydration = Math.max(2, hoursRemaining - 4);
      recommendedAction = 'Toma 500ml de agua inmediatamente';
    } else {
      riskLevel = 'CRITICAL';
      hoursUntilDehydration = 1;
      recommendedAction = 'Hidratación urgente: toma 750ml de agua ahora';
    }

    return {
      riskLevel,
      hoursUntilDehydration,
      recommendedAction,
    };
  }

  // Métodos auxiliares privados
  private getDefaultGoal(): number {
    return 2000; // 2 litros por defecto
  }

  private determineHydrationStatus(percentage: number): 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' {
    if (percentage >= 90) return 'EXCELLENT';
    if (percentage >= 70) return 'GOOD';
    if (percentage >= 50) return 'NEEDS_IMPROVEMENT';
    return 'POOR';
  }

  private calculateNextIntake(remainingMl: number, currentDate: Date): number {
    const currentHour = currentDate.getHours();
    const hoursUntilBedtime = Math.max(1, 22 - currentHour);
    
    if (remainingMl <= 0) return 0;
    
    // Distribuir el agua restante en las horas que quedan
    const mlPerHour = remainingMl / hoursUntilBedtime;
    
    // Sugerir entre 200-500ml por toma
    return Math.min(500, Math.max(200, Math.round(mlPerHour)));
  }

  private generateDailyInsights(totalMl: number, targetMl: number, percentage: number, date: Date): string[] {
    const insights: string[] = [];

    if (percentage >= 100) {
      insights.push('🎉 ¡Excelente! Has alcanzado tu objetivo de hidratación');
    } else if (percentage >= 80) {
      insights.push('👍 Vas muy bien, solo te faltan unos sorbos más');
    } else if (percentage >= 50) {
      insights.push('⚡ Necesitas acelerar el ritmo de hidratación');
    } else {
      insights.push('🚨 Tu hidratación está muy por debajo del objetivo');
    }

    const currentHour = date.getHours();
    if (currentHour >= 18 && percentage < 70) {
      insights.push('🌅 Intenta tomar más agua temprano en el día mañana');
    }

    if (totalMl < 1000) {
      insights.push('💧 La deshidratación puede causar fatiga y dolores de cabeza');
    }

    return insights;
  }

  private groupLogsByDay(logs: any[]): Map<string, number> {
    const dailyTotals = new Map<string, number>();
    
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + log.ml);
    });

    return dailyTotals;
  }

  private findBestDay(dailyTotals: Map<string, number>): { date: Date; ml: number } {
    let bestDate = '';
    let bestMl = 0;

    for (const [date, ml] of dailyTotals.entries()) {
      if (ml > bestMl) {
        bestMl = ml;
        bestDate = date;
      }
    }

    return {
      date: bestDate ? new Date(bestDate) : new Date(),
      ml: bestMl,
    };
  }

  private findWorstDay(dailyTotals: Map<string, number>): { date: Date; ml: number } {
    let worstDate = '';
    let worstMl = Infinity;

    for (const [date, ml] of dailyTotals.entries()) {
      if (ml < worstMl) {
        worstMl = ml;
        worstDate = date;
      }
    }

    return {
      date: worstDate ? new Date(worstDate) : new Date(),
      ml: worstMl === Infinity ? 0 : worstMl,
    };
  }

  private calculateConsistency(dailyValues: number[], targetMl: number): 'EXCELLENT' | 'GOOD' | 'INCONSISTENT' | 'POOR' {
    if (dailyValues.length === 0) return 'POOR';

    const achievementDays = dailyValues.filter(ml => ml >= targetMl * 0.8).length;
    const percentage = (achievementDays / dailyValues.length) * 100;

    if (percentage >= 90) return 'EXCELLENT';
    if (percentage >= 70) return 'GOOD';
    if (percentage >= 50) return 'INCONSISTENT';
    return 'POOR';
  }

  private calculateCurrentStreak(dailyTotals: Map<string, number>, targetMl: number): number {
    const sortedDates = Array.from(dailyTotals.keys()).sort().reverse();
    let streak = 0;

    for (const date of sortedDates) {
      const ml = dailyTotals.get(date) || 0;
      if (ml >= targetMl * 0.8) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateMissedDays(dailyTotals: Map<string, number>, targetMl: number, totalDays: number): number {
    let missedDays = 0;

    for (const ml of dailyTotals.values()) {
      if (ml < targetMl * 0.8) {
        missedDays++;
      }
    }

    return missedDays;
  }

  private calculatePeakHours(logs: any[]): string[] {
    // Simplificado: retornar horas comunes
    return ['08:00', '12:00', '16:00', '20:00'];
  }

  private calculateExpectedIntakeByHour(dailyTarget: number, currentHour: number): number {
    // Distribución típica: más agua en horas activas (7-22)
    const activeHours = 15; // 7am a 10pm
    const startHour = 7;
    
    if (currentHour < startHour) return 0;
    if (currentHour >= 22) return dailyTarget;
    
    const hoursElapsed = currentHour - startHour + 1;
    return (dailyTarget * hoursElapsed) / activeHours;
  }
}