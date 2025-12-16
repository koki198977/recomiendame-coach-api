import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HealthMonitorPort } from '../../core/application/chapi/ports/out.health-monitor.port';
import { HYDRATION_ANALYZER, HydrationAnalyzerPort } from '../../core/application/hydration/ports/out.hydration-analyzer.port';
import { 
  WeightAnalysis, 
  CheckinPattern, 
  HealthAlert, 
  ProactiveNotification,
  HealthAlertType,
  AlertSeverity 
} from '../../core/domain/chapi/health-monitoring.entities';

@Injectable()
export class ChapiHealthMonitorService implements HealthMonitorPort {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(HYDRATION_ANALYZER) private readonly hydrationAnalyzer: HydrationAnalyzerPort,
  ) {}

  async analyzeWeightProgress(params: {
    userId: string;
    days?: number;
  }): Promise<WeightAnalysis> {
    const { userId, days = 30 } = params;
    
    // Obtener perfil del usuario
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            goals: {
              where: { goalType: 'LOSS' },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!profile) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener checkins recientes
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const checkins = await this.prisma.checkin.findMany({
      where: {
        userId,
        date: { gte: startDate },
        weightKg: { not: null }
      },
      orderBy: { date: 'asc' }
    });

    if (checkins.length < 2) {
      return this.createDefaultAnalysis(profile);
    }

    // Calcular tendencias
    const weights = checkins.map(c => parseFloat(c.weightKg!.toString()));
    const currentWeight = weights[weights.length - 1];
    const initialWeight = weights[0];
    const targetWeight = parseFloat(profile.targetWeightKg?.toString() || '0');

    // Calcular cambio semanal promedio
    const totalDays = (checkins[checkins.length - 1].date.getTime() - checkins[0].date.getTime()) / (1000 * 60 * 60 * 24);
    const totalWeightChange = currentWeight - initialWeight;
    const weeklyChange = (totalWeightChange / totalDays) * 7;

    // Determinar tendencia mensual
    const monthlyTrend = this.calculateMonthlyTrend(weights);

    // Evaluar si el ritmo es saludable
    const { isHealthyPace, recommendedWeeklyPace, riskLevel } = this.evaluateWeightLossPace(
      weeklyChange, 
      profile.user.goals[0]?.goalType || 'LOSS'
    );

    // Calcular días estimados para llegar al objetivo
    const remainingWeight = Math.abs(currentWeight - targetWeight);
    const daysToGoal = recommendedWeeklyPace > 0 ? Math.ceil((remainingWeight / recommendedWeeklyPace) * 7) : 0;

    // Generar insights
    const insights = this.generateWeightInsights({
      weeklyChange,
      isHealthyPace,
      monthlyTrend,
      currentWeight,
      targetWeight,
      riskLevel
    });

    return {
      currentWeight,
      targetWeight,
      weeklyChange,
      monthlyTrend,
      isHealthyPace,
      recommendedWeeklyPace,
      daysToGoal,
      riskLevel,
      insights
    };
  }

  async analyzeCheckinPattern(params: {
    userId: string;
    days?: number;
  }): Promise<CheckinPattern> {
    const { userId, days = 60 } = params;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const checkins = await this.prisma.checkin.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      orderBy: { date: 'desc' }
    });

    const lastCheckinDate = checkins.length > 0 ? checkins[0].date : null;
    const daysSinceLastCheckin = lastCheckinDate 
      ? Math.floor((new Date().getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24))
      : days;

    // Calcular frecuencia promedio
    let averageFrequency = 0;
    if (checkins.length > 1) {
      const intervals: number[] = [];
      for (let i = 0; i < checkins.length - 1; i++) {
        const daysDiff = Math.floor(
          (checkins[i].date.getTime() - checkins[i + 1].date.getTime()) / (1000 * 60 * 60 * 24)
        );
        intervals.push(daysDiff);
      }
      averageFrequency = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    // Determinar consistencia
    const consistency = this.evaluateConsistency(daysSinceLastCheckin, averageFrequency);

    // Calcular checkins perdidos (asumiendo que debería hacer checkin cada 3 días)
    const expectedCheckins = Math.floor(days / 3);
    const missedCheckins = Math.max(0, expectedCheckins - checkins.length);

    return {
      lastCheckinDate,
      daysSinceLastCheckin,
      averageFrequency,
      consistency,
      missedCheckins
    };
  }

  async generateHealthAlerts(params: { userId: string }): Promise<HealthAlert[]> {
    const alerts: HealthAlert[] = [];

    // Analizar peso
    const weightAnalysis = await this.analyzeWeightProgress(params);
    if (weightAnalysis.riskLevel === AlertSeverity.HIGH || weightAnalysis.riskLevel === AlertSeverity.CRITICAL) {
      alerts.push(this.createWeightAlert(params.userId, weightAnalysis));
    }

    // Analizar patrones de checkin
    const checkinPattern = await this.analyzeCheckinPattern(params);
    if (checkinPattern.consistency === 'POOR' || checkinPattern.consistency === 'CRITICAL') {
      alerts.push(this.createCheckinAlert(params.userId, checkinPattern));
    }

    return alerts;
  }

  async generateProactiveNotifications(params: { userId: string }): Promise<ProactiveNotification[]> {
    const notifications: ProactiveNotification[] = [];

    const [weightAnalysis, checkinPattern, hydrationNotifications] = await Promise.all([
      this.analyzeWeightProgress(params),
      this.analyzeCheckinPattern(params),
      this.hydrationAnalyzer.generateHydrationNotifications(params)
    ]);

    // Notificación por pérdida rápida de peso
    if (weightAnalysis.weeklyChange < -1.5) {
      notifications.push({
        userId: params.userId,
        type: 'HEALTH_ALERT',
        title: '⚠️ Pérdida de peso muy rápida',
        body: `Estás perdiendo ${Math.abs(weightAnalysis.weeklyChange).toFixed(1)}kg por semana. Esto puede ser peligroso. ¿Quieres que ajuste tu plan?`,
        data: { weightAnalysis },
        scheduledFor: new Date(),
        priority: 'HIGH',
        actionButtons: [
          { id: 'adjust_plan', label: 'Ajustar Plan', action: 'ADJUST_PLAN' },
          { id: 'contact_support', label: 'Hablar con Experto', action: 'CONTACT_SUPPORT' }
        ]
      });
    }

    // Notificación por falta de checkins
    if (checkinPattern.daysSinceLastCheckin > 7) {
      notifications.push({
        userId: params.userId,
        type: 'CHECK_IN_REMINDER',
        title: '🤗 Te extrañamos',
        body: `Han pasado ${checkinPattern.daysSinceLastCheckin} días sin tu check-in. Ayúdame a generar planes más especializados para ti.`,
        data: { checkinPattern },
        scheduledFor: new Date(),
        priority: 'MEDIUM',
        actionButtons: [
          { id: 'do_checkin', label: 'Hacer Check-in', action: 'SCHEDULE_CHECKIN' },
          { id: 'view_progress', label: 'Ver Progreso', action: 'VIEW_PROGRESS' }
        ]
      });
    }

    // Notificación motivacional por buen progreso
    if (weightAnalysis.isHealthyPace && weightAnalysis.weeklyChange < 0) {
      notifications.push({
        userId: params.userId,
        type: 'MOTIVATION',
        title: '🎉 ¡Excelente progreso!',
        body: `Vas súper bien con ${Math.abs(weightAnalysis.weeklyChange).toFixed(1)}kg por semana. ¡Sigue así!`,
        data: { weightAnalysis },
        scheduledFor: new Date(),
        priority: 'LOW'
      });
    }

    // Agregar notificaciones de hidratación
    hydrationNotifications.forEach(hydrationNotif => {
      notifications.push({
        userId: params.userId,
        type: hydrationNotif.type === 'DEHYDRATION_RISK' ? 'HEALTH_ALERT' : 'MOTIVATION',
        title: hydrationNotif.title,
        body: hydrationNotif.body,
        data: hydrationNotif.data,
        scheduledFor: new Date(),
        priority: hydrationNotif.priority,
        actionButtons: hydrationNotif.actionButtons?.map(btn => ({
          id: btn.id,
          label: btn.label,
          action: btn.action as any,
          data: btn.data
        }))
      });
    });

    return notifications;
  }

  async analyzeAllUsers(): Promise<{
    usersAnalyzed: number;
    alertsGenerated: number;
    notificationsScheduled: number;
  }> {
    const users = await this.prisma.user.findMany({
      where: {
        profile: { isNot: null }
      },
      select: { id: true }
    });

    let alertsGenerated = 0;
    let notificationsScheduled = 0;

    for (const user of users) {
      try {
        const alerts = await this.generateHealthAlerts({ userId: user.id });
        const notifications = await this.generateProactiveNotifications({ userId: user.id });

        // Aquí guardarías las alertas y programarías las notificaciones
        // Por ahora solo contamos
        alertsGenerated += alerts.length;
        notificationsScheduled += notifications.length;

        // Log para debugging
        if (alerts.length > 0 || notifications.length > 0) {
          console.log(`Usuario ${user.id}: ${alerts.length} alertas, ${notifications.length} notificaciones`);
        }
      } catch (error) {
        console.error(`Error analizando usuario ${user.id}:`, error);
      }
    }

    return {
      usersAnalyzed: users.length,
      alertsGenerated,
      notificationsScheduled
    };
  }

  // Métodos auxiliares privados
  private createDefaultAnalysis(profile: any): WeightAnalysis {
    const currentWeight = parseFloat(profile.weightKg?.toString() || '0');
    const targetWeight = parseFloat(profile.targetWeightKg?.toString() || '0');

    return {
      currentWeight,
      targetWeight,
      weeklyChange: 0,
      monthlyTrend: 'STABLE',
      isHealthyPace: true,
      recommendedWeeklyPace: 0.5,
      daysToGoal: 0,
      riskLevel: AlertSeverity.LOW,
      insights: ['Necesitas más datos de check-ins para generar un análisis completo.']
    };
  }

  private calculateMonthlyTrend(weights: number[]): 'LOSING' | 'GAINING' | 'STABLE' {
    if (weights.length < 2) return 'STABLE';
    
    const change = weights[weights.length - 1] - weights[0];
    if (change < -0.5) return 'LOSING';
    if (change > 0.5) return 'GAINING';
    return 'STABLE';
  }

  private evaluateWeightLossPace(weeklyChange: number, goalType: string) {
    const absChange = Math.abs(weeklyChange);
    
    // Ritmo saludable: 0.5-1kg por semana para pérdida de peso
    const isHealthyPace = goalType === 'LOSS' 
      ? (weeklyChange < 0 && absChange >= 0.3 && absChange <= 1.0)
      : (goalType === 'GAIN' ? (weeklyChange > 0 && absChange <= 0.5) : true);

    let riskLevel = AlertSeverity.LOW;
    if (absChange > 1.5) riskLevel = AlertSeverity.CRITICAL;
    else if (absChange > 1.0) riskLevel = AlertSeverity.HIGH;
    else if (absChange > 0.8) riskLevel = AlertSeverity.MEDIUM;

    const recommendedWeeklyPace = goalType === 'LOSS' ? 0.5 : 0.3;

    return { isHealthyPace, recommendedWeeklyPace, riskLevel };
  }

  private evaluateConsistency(daysSinceLastCheckin: number, averageFrequency: number): 'EXCELLENT' | 'GOOD' | 'POOR' | 'CRITICAL' {
    if (daysSinceLastCheckin <= 3) return 'EXCELLENT';
    if (daysSinceLastCheckin <= 7) return 'GOOD';
    if (daysSinceLastCheckin <= 14) return 'POOR';
    return 'CRITICAL';
  }

  private generateWeightInsights(data: {
    weeklyChange: number;
    isHealthyPace: boolean;
    monthlyTrend: string;
    currentWeight: number;
    targetWeight: number;
    riskLevel: AlertSeverity;
  }): string[] {
    const insights: string[] = [];

    if (data.riskLevel === AlertSeverity.CRITICAL) {
      insights.push('⚠️ Tu ritmo de pérdida de peso es peligrosamente rápido. Consulta con un profesional.');
    } else if (data.riskLevel === AlertSeverity.HIGH) {
      insights.push('⚡ Estás perdiendo peso muy rápido. Considera reducir el déficit calórico.');
    } else if (data.isHealthyPace) {
      insights.push('✅ Tu ritmo de pérdida de peso es saludable y sostenible.');
    }

    if (Math.abs(data.weeklyChange) < 0.1) {
      insights.push('📊 Tu peso se ha mantenido estable. Si buscas cambios, revisa tu plan.');
    }

    const remaining = Math.abs(data.currentWeight - data.targetWeight);
    if (remaining < 2) {
      insights.push('🎯 ¡Estás muy cerca de tu objetivo! Mantén la consistencia.');
    }

    return insights;
  }

  private createWeightAlert(userId: string, analysis: WeightAnalysis): HealthAlert {
    return {
      id: `weight_${userId}_${Date.now()}`,
      userId,
      type: analysis.weeklyChange < -1.5 ? HealthAlertType.RAPID_WEIGHT_LOSS : HealthAlertType.RAPID_WEIGHT_GAIN,
      severity: analysis.riskLevel,
      title: analysis.weeklyChange < 0 ? 'Pérdida de peso muy rápida' : 'Ganancia de peso rápida',
      message: `Cambio semanal: ${analysis.weeklyChange.toFixed(1)}kg. ${analysis.insights[0]}`,
      data: analysis,
      createdAt: new Date(),
      acknowledged: false
    };
  }

  private createCheckinAlert(userId: string, pattern: CheckinPattern): HealthAlert {
    return {
      id: `checkin_${userId}_${Date.now()}`,
      userId,
      type: HealthAlertType.MISSING_CHECKINS,
      severity: pattern.consistency === 'CRITICAL' ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
      title: 'Faltan check-ins regulares',
      message: `${pattern.daysSinceLastCheckin} días sin check-in. ${pattern.missedCheckins} check-ins perdidos.`,
      data: pattern,
      createdAt: new Date(),
      acknowledged: false
    };
  }
}