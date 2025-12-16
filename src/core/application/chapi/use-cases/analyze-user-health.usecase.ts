import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { HEALTH_MONITOR, HealthMonitorPort } from '../ports/out.health-monitor.port';
import { WeightAnalysis, CheckinPattern, HealthAlert, ProactiveNotification } from '../../../domain/chapi/health-monitoring.entities';

export interface AnalyzeUserHealthInput {
  userId: string;
  includeNotifications?: boolean;
}

export interface AnalyzeUserHealthOutput {
  weightAnalysis: WeightAnalysis;
  checkinPattern: CheckinPattern;
  healthAlerts: HealthAlert[];
  proactiveNotifications?: ProactiveNotification[];
  recommendations: string[];
  riskScore: number; // 0-100
}

@Injectable()
export class AnalyzeUserHealthUseCase {
  constructor(
    @Inject(HEALTH_MONITOR) private readonly healthMonitor: HealthMonitorPort,
  ) {}

  async execute(
    input: AnalyzeUserHealthInput,
  ): Promise<Result<AnalyzeUserHealthOutput>> {
    try {
      // Análisis paralelo de todos los aspectos de salud
      const [weightAnalysis, checkinPattern, healthAlerts] = await Promise.all([
        this.healthMonitor.analyzeWeightProgress({ userId: input.userId }),
        this.healthMonitor.analyzeCheckinPattern({ userId: input.userId }),
        this.healthMonitor.generateHealthAlerts({ userId: input.userId }),
      ]);

      // Generar notificaciones proactivas si se solicita
      let proactiveNotifications: ProactiveNotification[] | undefined;
      if (input.includeNotifications) {
        proactiveNotifications = await this.healthMonitor.generateProactiveNotifications({
          userId: input.userId,
        });
      }

      // Calcular score de riesgo general
      const riskScore = this.calculateRiskScore(weightAnalysis, checkinPattern, healthAlerts);

      // Generar recomendaciones personalizadas
      const recommendations = this.generateRecommendations(
        weightAnalysis,
        checkinPattern,
        healthAlerts,
        riskScore
      );

      return ok({
        weightAnalysis,
        checkinPattern,
        healthAlerts,
        proactiveNotifications,
        recommendations,
        riskScore,
      });
    } catch (error) {
      return err(error);
    }
  }

  private calculateRiskScore(
    weightAnalysis: WeightAnalysis,
    checkinPattern: CheckinPattern,
    healthAlerts: HealthAlert[]
  ): number {
    let score = 0;

    // Peso (40% del score)
    switch (weightAnalysis.riskLevel) {
      case 'CRITICAL': score += 40; break;
      case 'HIGH': score += 30; break;
      case 'MEDIUM': score += 15; break;
      case 'LOW': score += 5; break;
    }

    // Consistencia de check-ins (30% del score)
    switch (checkinPattern.consistency) {
      case 'CRITICAL': score += 30; break;
      case 'POOR': score += 20; break;
      case 'GOOD': score += 10; break;
      case 'EXCELLENT': score += 0; break;
    }

    // Alertas de salud (30% del score)
    const criticalAlerts = healthAlerts.filter(a => a.severity === 'CRITICAL').length;
    const highAlerts = healthAlerts.filter(a => a.severity === 'HIGH').length;
    const mediumAlerts = healthAlerts.filter(a => a.severity === 'MEDIUM').length;

    score += criticalAlerts * 15 + highAlerts * 10 + mediumAlerts * 5;

    return Math.min(100, score);
  }

  private generateRecommendations(
    weightAnalysis: WeightAnalysis,
    checkinPattern: CheckinPattern,
    healthAlerts: HealthAlert[],
    riskScore: number
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en peso
    if (weightAnalysis.riskLevel === 'CRITICAL' || weightAnalysis.riskLevel === 'HIGH') {
      recommendations.push('🚨 Consulta inmediatamente con un profesional de la salud sobre tu ritmo de pérdida de peso');
      recommendations.push('📉 Considera aumentar gradualmente tu ingesta calórica para un ritmo más saludable');
    } else if (!weightAnalysis.isHealthyPace && Math.abs(weightAnalysis.weeklyChange) < 0.2) {
      recommendations.push('📊 Tu progreso se ha estancado. Revisa tu plan nutricional y de ejercicios');
      recommendations.push('🔄 Considera hacer ajustes en tu déficit calórico o rutina de ejercicios');
    } else if (weightAnalysis.isHealthyPace) {
      recommendations.push('✅ ¡Excelente! Mantén tu ritmo actual, es saludable y sostenible');
    }

    // Recomendaciones basadas en check-ins
    if (checkinPattern.consistency === 'CRITICAL' || checkinPattern.consistency === 'POOR') {
      recommendations.push('📱 Establece recordatorios para hacer check-ins regulares (cada 2-3 días)');
      recommendations.push('📈 Los datos regulares me ayudan a personalizar mejor tus planes');
    } else if (checkinPattern.consistency === 'EXCELLENT') {
      recommendations.push('🌟 ¡Perfecta consistencia con tus check-ins! Esto me permite ayudarte mejor');
    }

    // Recomendaciones basadas en score de riesgo
    if (riskScore > 70) {
      recommendations.push('⚠️ Tu score de riesgo es alto. Prioriza consultar con un profesional');
      recommendations.push('🛡️ Considera reducir la intensidad de tu plan hasta estabilizar');
    } else if (riskScore > 40) {
      recommendations.push('⚡ Hay algunas áreas de mejora. Revisa las alertas específicas');
    } else if (riskScore < 20) {
      recommendations.push('🎯 ¡Vas excelente! Puedes considerar optimizar tu plan para mejores resultados');
    }

    // Recomendaciones específicas por tipo de alerta
    const rapidWeightLoss = healthAlerts.find(a => a.type === 'RAPID_WEIGHT_LOSS');
    if (rapidWeightLoss) {
      recommendations.push('🍽️ Aumenta tu ingesta de proteínas y grasas saludables');
      recommendations.push('💪 Reduce la intensidad del ejercicio cardiovascular temporalmente');
    }

    const missingCheckins = healthAlerts.find(a => a.type === 'MISSING_CHECKINS');
    if (missingCheckins) {
      recommendations.push('⏰ Configura notificaciones diarias para recordar tu check-in');
      recommendations.push('📊 Incluso datos básicos como peso me ayudan enormemente');
    }

    return recommendations.slice(0, 5); // Máximo 5 recomendaciones para no abrumar
  }
}