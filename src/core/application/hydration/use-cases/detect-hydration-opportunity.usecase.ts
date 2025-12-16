import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { HYDRATION_REPO, HydrationRepoPort } from '../ports/out.hydration-repo.port';
import { PROFILE_REPO, ProfileRepoPort } from '../../profile/ports/out.profile-repo.port';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export interface DetectHydrationOpportunityInput {
  userId: string;
}

export interface HydrationOpportunity {
  type: 'ONBOARDING' | 'FIRST_CHECKIN' | 'WEIGHT_PLATEAU' | 'LOW_ENERGY' | 'EXERCISE_ROUTINE' | 'HEALTH_CONDITION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  message: string;
  suggestedGoalMl: number;
  trigger: string;
  callToAction: string;
}

export interface DetectHydrationOpportunityOutput {
  shouldSuggest: boolean;
  opportunity?: HydrationOpportunity;
  contextData: any;
}

@Injectable()
export class DetectHydrationOpportunityUseCase {
  constructor(
    @Inject(HYDRATION_REPO) private readonly hydrationRepo: HydrationRepoPort,
    @Inject(PROFILE_REPO) private readonly profileRepo: ProfileRepoPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: DetectHydrationOpportunityInput): Promise<Result<DetectHydrationOpportunityOutput>> {
    try {
      const { userId } = input;

      // Verificar si ya tiene objetivo de hidratación
      const existingGoal = await this.hydrationRepo.getGoal(userId);
      if (existingGoal?.isActive) {
        return ok({
          shouldSuggest: false,
          contextData: { hasGoal: true },
        });
      }

      // Obtener datos del usuario
      const [profile, recentCheckins, recentEmotionalLogs, recentHydrationLogs] = await Promise.all([
        this.profileRepo.get(userId),
        this.getRecentCheckins(userId),
        this.getRecentEmotionalLogs(userId),
        this.getRecentHydrationLogs(userId),
      ]);

      // Detectar oportunidades en orden de prioridad
      const opportunities = [
        await this.detectOnboardingOpportunity(profile),
        await this.detectFirstCheckinOpportunity(recentCheckins, profile),
        await this.detectWeightPlateauOpportunity(recentCheckins, profile),
        await this.detectLowEnergyOpportunity(recentEmotionalLogs, profile),
        await this.detectExerciseRoutineOpportunity(profile),
        await this.detectHealthConditionOpportunity(profile),
      ];

      // Encontrar la oportunidad de mayor prioridad
      const bestOpportunity = opportunities
        .filter(opp => opp !== null)
        .sort((a, b) => this.getPriorityScore(b!.priority) - this.getPriorityScore(a!.priority))[0];

      if (bestOpportunity) {
        return ok({
          shouldSuggest: true,
          opportunity: bestOpportunity,
          contextData: {
            profile,
            recentCheckins: recentCheckins.length,
            recentEmotionalLogs: recentEmotionalLogs.length,
          },
        });
      }

      return ok({
        shouldSuggest: false,
        contextData: { noOpportunityFound: true },
      });
    } catch (error) {
      return err(error);
    }
  }

  private async detectOnboardingOpportunity(profile: any): Promise<HydrationOpportunity | null> {
    if (!profile?.weightKg || !profile?.activityLevel) {
      return null;
    }

    // Usuario completó perfil recientemente
    const profileAge = Date.now() - new Date(profile.createdAt).getTime();
    const isRecentProfile = profileAge < 7 * 24 * 60 * 60 * 1000; // 7 días

    if (isRecentProfile) {
      return {
        type: 'ONBOARDING',
        priority: 'HIGH',
        title: '💧 ¡Personalicemos tu hidratación!',
        message: 'Ahora que tienes tu perfil completo, puedo calcular tu objetivo ideal de hidratación.',
        suggestedGoalMl: this.calculateBasicGoal(profile),
        trigger: 'Perfil completado recientemente',
        callToAction: 'Configurar objetivo de hidratación',
      };
    }

    return null;
  }

  private async detectFirstCheckinOpportunity(checkins: any[], profile: any): Promise<HydrationOpportunity | null> {
    if (checkins.length === 0) return null;

    // Primer check-in del usuario
    if (checkins.length === 1) {
      return {
        type: 'FIRST_CHECKIN',
        priority: 'HIGH',
        title: '🎉 ¡Excelente primer check-in!',
        message: 'Para maximizar tus resultados, la hidratación es clave. ¿Configuramos tu objetivo de agua?',
        suggestedGoalMl: this.calculateBasicGoal(profile),
        trigger: 'Primer check-in realizado',
        callToAction: 'Sí, configurar hidratación',
      };
    }

    return null;
  }

  private async detectWeightPlateauOpportunity(checkins: any[], profile: any): Promise<HydrationOpportunity | null> {
    if (checkins.length < 5) return null;

    // Detectar estancamiento en peso
    const recentWeights = checkins
      .filter(c => c.weightKg)
      .slice(0, 5)
      .map(c => parseFloat(c.weightKg.toString()));

    if (recentWeights.length >= 3) {
      const weightVariation = Math.max(...recentWeights) - Math.min(...recentWeights);
      
      // Si la variación es muy pequeña (estancamiento)
      if (weightVariation < 0.5 && profile.nutritionGoal === 'LOSE_WEIGHT') {
        return {
          type: 'WEIGHT_PLATEAU',
          priority: 'MEDIUM',
          title: '📊 ¿Estancado en tu peso?',
          message: 'La hidratación adecuada puede acelerar tu metabolismo y ayudar a romper el estancamiento.',
          suggestedGoalMl: this.calculateBasicGoal(profile),
          trigger: 'Peso estancado por 5 check-ins',
          callToAction: 'Probar hidratación optimizada',
        };
      }
    }

    return null;
  }

  private async detectLowEnergyOpportunity(emotionalLogs: any[], profile: any): Promise<HydrationOpportunity | null> {
    if (emotionalLogs.length === 0) return null;

    // Detectar patrones de baja energía o fatiga
    const lowEnergyKeywords = ['cansado', 'fatiga', 'sin energía', 'agotado', 'somnoliento'];
    const hasLowEnergyPattern = emotionalLogs.some(log => 
      lowEnergyKeywords.some(keyword => 
        log.message.toLowerCase().includes(keyword) || 
        log.emotion.toLowerCase().includes(keyword)
      )
    );

    if (hasLowEnergyPattern) {
      return {
        type: 'LOW_ENERGY',
        priority: 'MEDIUM',
        title: '⚡ ¿Te sientes sin energía?',
        message: 'La deshidratación es una causa común de fatiga. Una hidratación adecuada puede darte más energía.',
        suggestedGoalMl: this.calculateBasicGoal(profile),
        trigger: 'Patrón de baja energía detectado',
        callToAction: 'Mejorar mi energía con hidratación',
      };
    }

    return null;
  }

  private async detectExerciseRoutineOpportunity(profile: any): Promise<HydrationOpportunity | null> {
    if (profile.activityLevel === 'VERY_ACTIVE' || profile.activityLevel === 'ACTIVE') {
      return {
        type: 'EXERCISE_ROUTINE',
        priority: 'MEDIUM',
        title: '💪 ¡Optimiza tu rendimiento!',
        message: 'Con tu nivel de actividad física, la hidratación correcta puede mejorar significativamente tu rendimiento.',
        suggestedGoalMl: this.calculateBasicGoal(profile, 1.3), // 30% más para activos
        trigger: 'Alto nivel de actividad física',
        callToAction: 'Optimizar hidratación deportiva',
      };
    }

    return null;
  }

  private async detectHealthConditionOpportunity(profile: any): Promise<HydrationOpportunity | null> {
    if (!profile.conditions || profile.conditions.length === 0) return null;

    // Condiciones que se benefician de buena hidratación
    const hydrationBeneficialConditions = ['diabetes', 'hipertensión', 'riñón'];
    const hasRelevantCondition = profile.conditions.some((condition: any) =>
      hydrationBeneficialConditions.some(keyword => 
        condition.label.toLowerCase().includes(keyword)
      )
    );

    if (hasRelevantCondition) {
      return {
        type: 'HEALTH_CONDITION',
        priority: 'HIGH',
        title: '🩺 Hidratación para tu salud',
        message: 'Dada tu condición de salud, mantener una hidratación adecuada es especialmente importante.',
        suggestedGoalMl: this.calculateBasicGoal(profile),
        trigger: 'Condición de salud que se beneficia de hidratación',
        callToAction: 'Configurar hidratación terapéutica',
      };
    }

    return null;
  }

  private calculateBasicGoal(profile: any, multiplier: number = 1): number {
    if (!profile?.weightKg) return 2000;
    
    const weight = parseFloat(profile.weightKg.toString());
    const baseMl = weight * 35 * multiplier;
    
    return Math.round(baseMl / 250) * 250; // Redondear a múltiplos de 250ml
  }

  private getPriorityScore(priority: string): number {
    switch (priority) {
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  private async getRecentCheckins(userId: string) {
    return this.prisma.checkin.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
    });
  }

  private async getRecentEmotionalLogs(userId: string) {
    return this.prisma.emotionalLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  private async getRecentHydrationLogs(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.prisma.hydrationLog.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
      },
    });
  }
}