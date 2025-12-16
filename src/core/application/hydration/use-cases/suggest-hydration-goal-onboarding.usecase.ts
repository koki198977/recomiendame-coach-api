import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { HYDRATION_ANALYZER, HydrationAnalyzerPort } from '../ports/out.hydration-analyzer.port';
import { PROFILE_REPO, ProfileRepoPort } from '../../profile/ports/out.profile-repo.port';

export interface SuggestHydrationGoalOnboardingInput {
  userId: string;
}

export interface SuggestHydrationGoalOnboardingOutput {
  shouldSuggest: boolean;
  suggestedGoalMl: number;
  reason: string;
  benefits: string[];
  setupSteps: Array<{
    step: number;
    title: string;
    description: string;
  }>;
}

@Injectable()
export class SuggestHydrationGoalOnboardingUseCase {
  constructor(
    @Inject(HYDRATION_ANALYZER) private readonly analyzer: HydrationAnalyzerPort,
    @Inject(PROFILE_REPO) private readonly profileRepo: ProfileRepoPort,
  ) {}

  async execute(input: SuggestHydrationGoalOnboardingInput): Promise<Result<SuggestHydrationGoalOnboardingOutput>> {
    try {
      const { userId } = input;

      // Obtener perfil del usuario
      const profile = await this.profileRepo.get(userId);
      
      if (!profile) {
        return err(new Error('Perfil no encontrado'));
      }

      // Verificar si tiene datos suficientes para sugerir
      const hasWeightData = !!profile.weightKg;
      const hasActivityLevel = !!profile.activityLevel;
      
      if (!hasWeightData || !hasActivityLevel) {
        return ok({
          shouldSuggest: false,
          suggestedGoalMl: 2000, // Default
          reason: 'Necesitamos más información de tu perfil para personalizar tu objetivo de hidratación',
          benefits: [],
          setupSteps: [],
        });
      }

      // Calcular objetivo personalizado
      const suggestedGoalMl = await this.analyzer.calculateOptimalGoal({
        userId,
        weightKg: parseFloat(profile.weightKg.toString()),
        activityLevel: profile.activityLevel,
        climate: 'MODERATE', // Por defecto, podrías usar geolocalización
      });

      // Generar razón personalizada
      const reason = this.generatePersonalizedReason(profile, suggestedGoalMl);

      // Beneficios específicos
      const benefits = this.generateBenefits(profile, suggestedGoalMl);

      // Pasos de configuración
      const setupSteps = this.generateSetupSteps();

      return ok({
        shouldSuggest: true,
        suggestedGoalMl,
        reason,
        benefits,
        setupSteps,
      });
    } catch (error) {
      return err(error);
    }
  }

  private generatePersonalizedReason(profile: any, goalMl: number): string {
    const liters = (goalMl / 1000).toFixed(1);
    const weight = parseFloat(profile.weightKg.toString());
    const activity = profile.activityLevel;

    let reason = `Basándome en tu peso de ${weight}kg`;
    
    if (activity === 'VERY_ACTIVE' || activity === 'ACTIVE') {
      reason += ` y tu alto nivel de actividad física`;
    } else if (activity === 'SEDENTARY') {
      reason += ` y tu estilo de vida más sedentario`;
    }

    reason += `, tu objetivo ideal de hidratación es ${liters}L diarios.`;

    return reason;
  }

  private generateBenefits(profile: any, goalMl: number): string[] {
    const benefits = [
      '💧 Mejora tu energía y concentración durante el día',
      '🧠 Optimiza tu rendimiento mental y físico',
      '✨ Mejora la apariencia de tu piel',
    ];

    // Beneficios específicos según objetivo
    if (profile.nutritionGoal === 'LOSE_WEIGHT') {
      benefits.push('🔥 Acelera tu metabolismo y ayuda con la pérdida de peso');
    }

    if (profile.activityLevel === 'VERY_ACTIVE' || profile.activityLevel === 'ACTIVE') {
      benefits.push('💪 Mejora tu recuperación después del ejercicio');
    }

    // Beneficios según condiciones de salud
    if (profile.conditions?.some((c: any) => c.label.includes('diabetes'))) {
      benefits.push('🩺 Ayuda a mantener niveles estables de glucosa');
    }

    return benefits.slice(0, 4); // Máximo 4 beneficios
  }

  private generateSetupSteps(): Array<{ step: number; title: string; description: string }> {
    return [
      {
        step: 1,
        title: 'Confirma tu objetivo',
        description: 'Acepta la recomendación o ajústala según tus preferencias'
      },
      {
        step: 2,
        title: 'Configura recordatorios',
        description: 'Elige cada cuánto tiempo quieres recibir recordatorios'
      },
      {
        step: 3,
        title: 'Define tu horario',
        description: 'Establece a qué hora empiezas y terminas de tomar agua'
      },
      {
        step: 4,
        title: '¡Comienza a hidratarte!',
        description: 'Registra tu primer vaso de agua y comienza tu nueva rutina'
      }
    ];
  }
}