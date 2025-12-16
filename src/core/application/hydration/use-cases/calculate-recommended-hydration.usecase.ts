import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { HYDRATION_ANALYZER, HydrationAnalyzerPort } from '../ports/out.hydration-analyzer.port';
import { PROFILE_REPO, ProfileRepoPort } from '../../profile/ports/out.profile-repo.port';

export interface CalculateRecommendedHydrationInput {
  userId: string;
}

export interface CalculateRecommendedHydrationOutput {
  recommendedMl: number;
  baseCalculation: {
    weightBasedMl: number;
    activityMultiplier: number;
    climateMultiplier: number;
    conditionsAdjustment: number;
  };
  factors: {
    weight: number;
    activityLevel: string;
    age?: number;
    sex?: string;
    conditions: string[];
    climate: string;
  };
  explanation: string;
  ranges: {
    minimum: number;
    optimal: number;
    maximum: number;
  };
  tips: string[];
}

@Injectable()
export class CalculateRecommendedHydrationUseCase {
  constructor(
    @Inject(HYDRATION_ANALYZER) private readonly analyzer: HydrationAnalyzerPort,
    @Inject(PROFILE_REPO) private readonly profileRepo: ProfileRepoPort,
  ) {}

  async execute(input: CalculateRecommendedHydrationInput): Promise<Result<CalculateRecommendedHydrationOutput>> {
    try {
      const { userId } = input;

      // Obtener perfil completo del usuario
      const profile = await this.profileRepo.get(userId);
      
      if (!profile) {
        return err(new Error('Perfil de usuario no encontrado'));
      }

      // Extraer datos del perfil
      const weight = parseFloat(profile.weightKg?.toString() || '70');
      const height = profile.heightCm || 170;
      const activityLevel = profile.activityLevel || 'MODERATE';
      const sex = profile.sex || 'UNSPECIFIED';
      const age = this.calculateAge(profile.birthDate);
      const conditions = profile.conditions?.map((c: any) => c.label) || [];

      // Determinar clima (por ahora Chile = templado, podrías usar geolocalización)
      const climate = this.determineClimate(profile.country);

      // Cálculo base: 35ml por kg de peso
      const weightBasedMl = weight * 35;

      // Multiplicador por actividad física
      const activityMultiplier = this.getActivityMultiplier(activityLevel);

      // Multiplicador por clima
      const climateMultiplier = this.getClimateMultiplier(climate);

      // Ajuste por condiciones médicas
      const conditionsAdjustment = this.getConditionsAdjustment(conditions);

      // Ajuste por edad y sexo
      const ageAdjustment = this.getAgeAdjustment(age, sex);

      // Cálculo final
      let recommendedMl = weightBasedMl * activityMultiplier * climateMultiplier;
      recommendedMl += conditionsAdjustment;
      recommendedMl *= ageAdjustment;

      // Redondear a múltiplos de 250ml
      recommendedMl = Math.round(recommendedMl / 250) * 250;

      // Calcular rangos
      const ranges = {
        minimum: Math.round(recommendedMl * 0.8 / 250) * 250,
        optimal: recommendedMl,
        maximum: Math.round(recommendedMl * 1.3 / 250) * 250,
      };

      // Generar explicación personalizada
      const explanation = this.generateExplanation(weight, activityLevel, conditions, recommendedMl);

      // Generar tips personalizados
      const tips = this.generatePersonalizedTips(profile, recommendedMl);

      return ok({
        recommendedMl,
        baseCalculation: {
          weightBasedMl,
          activityMultiplier,
          climateMultiplier,
          conditionsAdjustment,
        },
        factors: {
          weight,
          activityLevel,
          age,
          sex,
          conditions,
          climate,
        },
        explanation,
        ranges,
        tips,
      });
    } catch (error) {
      return err(error);
    }
  }

  private calculateAge(birthDate?: Date): number | undefined {
    if (!birthDate) return undefined;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private determineClimate(country?: string): string {
    // Simplificado - podrías usar APIs de clima o geolocalización
    if (country?.toLowerCase().includes('chile')) {
      return 'TEMPERATE';
    }
    return 'MODERATE';
  }

  private getActivityMultiplier(activityLevel: string): number {
    const multipliers = {
      'SEDENTARY': 1.0,
      'LIGHT': 1.1,
      'MODERATE': 1.2,
      'ACTIVE': 1.3,
      'VERY_ACTIVE': 1.4,
    };
    
    return multipliers[activityLevel as keyof typeof multipliers] || 1.2;
  }

  private getClimateMultiplier(climate: string): number {
    const multipliers = {
      'COLD': 1.0,
      'TEMPERATE': 1.1,
      'MODERATE': 1.1,
      'HOT': 1.3,
      'VERY_HOT': 1.5,
    };
    
    return multipliers[climate as keyof typeof multipliers] || 1.1;
  }

  private getConditionsAdjustment(conditions: string[]): number {
    let adjustment = 0;
    
    conditions.forEach(condition => {
      const lowerCondition = condition.toLowerCase();
      
      // Condiciones que requieren más hidratación
      if (lowerCondition.includes('diabetes')) {
        adjustment += 300; // +300ml para diabetes
      }
      if (lowerCondition.includes('hipertensión') || lowerCondition.includes('presión alta')) {
        adjustment += 200; // +200ml para hipertensión
      }
      if (lowerCondition.includes('riñón') || lowerCondition.includes('renal')) {
        adjustment += 400; // +400ml para problemas renales
      }
      if (lowerCondition.includes('fiebre') || lowerCondition.includes('infección')) {
        adjustment += 500; // +500ml para fiebre/infección
      }
      
      // Condiciones que requieren menos hidratación
      if (lowerCondition.includes('insuficiencia cardíaca')) {
        adjustment -= 300; // -300ml para insuficiencia cardíaca
      }
    });
    
    return adjustment;
  }

  private getAgeAdjustment(age?: number, sex?: string): number {
    if (!age) return 1.0;
    
    let adjustment = 1.0;
    
    // Ajuste por edad
    if (age > 65) {
      adjustment *= 0.95; // Adultos mayores necesitan un poco menos
    } else if (age < 25) {
      adjustment *= 1.05; // Jóvenes necesitan un poco más
    }
    
    // Ajuste por sexo (las mujeres generalmente necesitan un poco menos)
    if (sex === 'FEMALE') {
      adjustment *= 0.95;
    }
    
    return adjustment;
  }

  private generateExplanation(weight: number, activityLevel: string, conditions: string[], recommendedMl: number): string {
    const liters = (recommendedMl / 1000).toFixed(1);
    
    let explanation = `Tu objetivo personalizado de ${liters}L diarios se basa en:\n\n`;
    explanation += `• Tu peso de ${weight}kg (base: ${Math.round(weight * 35)}ml)\n`;
    
    const activityDescriptions = {
      'SEDENTARY': 'estilo de vida sedentario',
      'LIGHT': 'actividad física ligera',
      'MODERATE': 'actividad física moderada',
      'ACTIVE': 'alta actividad física',
      'VERY_ACTIVE': 'muy alta actividad física',
    };
    
    explanation += `• Tu ${activityDescriptions[activityLevel as keyof typeof activityDescriptions] || 'nivel de actividad'}\n`;
    
    if (conditions.length > 0) {
      explanation += `• Tus condiciones de salud: ${conditions.join(', ')}\n`;
    }
    
    explanation += `\nEste cálculo está optimizado específicamente para tu perfil y te ayudará a mantener una hidratación óptima.`;
    
    return explanation;
  }

  private generatePersonalizedTips(profile: any, recommendedMl: number): string[] {
    const tips: string[] = [];
    const liters = (recommendedMl / 1000).toFixed(1);
    
    // Tips básicos
    tips.push(`🌅 Comienza el día con un vaso de agua al despertar`);
    tips.push(`🍽️ Toma agua antes, durante y después de cada comida`);
    
    // Tips según actividad
    if (profile.activityLevel === 'VERY_ACTIVE' || profile.activityLevel === 'ACTIVE') {
      tips.push(`💪 Aumenta tu ingesta 500ml extra en días de entrenamiento intenso`);
      tips.push(`⚡ Toma 200ml cada 15-20 minutos durante el ejercicio`);
    }
    
    // Tips según objetivo nutricional
    if (profile.nutritionGoal === 'LOSE_WEIGHT') {
      tips.push(`🔥 Toma agua antes de las comidas para aumentar la saciedad`);
    }
    
    // Tips según condiciones
    if (profile.conditions?.some((c: any) => c.label.toLowerCase().includes('diabetes'))) {
      tips.push(`🩺 Mantén hidratación constante para ayudar con el control de glucosa`);
    }
    
    // Tips prácticos
    tips.push(`📱 Usa recordatorios cada 2 horas para crear el hábito`);
    tips.push(`🥤 Varía con agua con limón, té sin azúcar o agua con gas`);
    
    return tips.slice(0, 5); // Máximo 5 tips
  }
}