import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { HYDRATION_REPO, HydrationRepoPort } from '../ports/out.hydration-repo.port';
import { HYDRATION_ANALYZER, HydrationAnalyzerPort } from '../ports/out.hydration-analyzer.port';
import { HydrationLog, HydrationAnalysis } from '../../../domain/hydration/entities';

export interface LogWaterIntakeInput {
  userId: string;
  ml: number;
  date?: Date;
}

export interface LogWaterIntakeOutput {
  log: HydrationLog;
  dailyAnalysis: HydrationAnalysis;
  message: string;
  achievements?: string[];
}

@Injectable()
export class LogWaterIntakeUseCase {
  constructor(
    @Inject(HYDRATION_REPO) private readonly hydrationRepo: HydrationRepoPort,
    @Inject(HYDRATION_ANALYZER) private readonly analyzer: HydrationAnalyzerPort,
  ) {}

  async execute(input: LogWaterIntakeInput): Promise<Result<LogWaterIntakeOutput>> {
    try {
      const { userId, ml, date = new Date() } = input;

      // Validaciones
      if (ml <= 0 || ml > 2000) {
        return err(new Error('La cantidad debe estar entre 1ml y 2000ml'));
      }

      // Crear el log
      const log = await this.hydrationRepo.createLog({
        userId,
        ml,
        date,
      });

      // Analizar el progreso del día
      const dailyAnalysis = await this.analyzer.analyzeDailyHydration({
        userId,
        date,
      });

      // Generar mensaje motivacional
      const message = this.generateMotivationalMessage(ml, dailyAnalysis);

      // Verificar logros
      const achievements = this.checkAchievements(dailyAnalysis);

      return ok({
        log,
        dailyAnalysis,
        message,
        achievements: achievements.length > 0 ? achievements : undefined,
      });
    } catch (error) {
      return err(error);
    }
  }

  private generateMotivationalMessage(ml: number, analysis: HydrationAnalysis): string {
    const messages = {
      EXCELLENT: [
        `¡Increíble! 🎉 ${ml}ml registrados. Has superado tu objetivo del día.`,
        `¡Fantástico! 💧 ${ml}ml más. Tu hidratación está en nivel experto.`,
        `¡Excelente trabajo! ✨ ${ml}ml registrados. Tu cuerpo te lo agradece.`,
      ],
      GOOD: [
        `¡Muy bien! 👍 ${ml}ml registrados. Vas ${analysis.achievementPercentage}% de tu objetivo.`,
        `¡Genial! 💪 ${ml}ml más. Solo te faltan ${analysis.remainingMl}ml para completar tu objetivo.`,
        `¡Sigue así! 🌟 ${ml}ml registrados. Estás muy cerca de tu meta.`,
      ],
      NEEDS_IMPROVEMENT: [
        `¡Buen progreso! 📈 ${ml}ml registrados. Llevas ${analysis.achievementPercentage}% del objetivo.`,
        `¡Cada gota cuenta! 💧 ${ml}ml más. Necesitas ${analysis.remainingMl}ml más para hoy.`,
        `¡Vamos por más! ⚡ ${ml}ml registrados. Tu cuerpo necesita más hidratación.`,
      ],
      POOR: [
        `¡Buen inicio! 🚀 ${ml}ml registrados. Aún necesitas ${analysis.remainingMl}ml más.`,
        `¡Cada paso cuenta! 💧 ${ml}ml más. Tu objetivo diario son ${analysis.targetMl}ml.`,
        `¡Sigue hidratándote! 🌊 ${ml}ml registrados. Tu cuerpo te lo agradecerá.`,
      ],
    };

    const statusMessages = messages[analysis.status];
    return statusMessages[Math.floor(Math.random() * statusMessages.length)];
  }

  private checkAchievements(analysis: HydrationAnalysis): string[] {
    const achievements: string[] = [];

    // Objetivo diario alcanzado
    if (analysis.achievementPercentage >= 100 && analysis.achievementPercentage < 110) {
      achievements.push('🎯 ¡Objetivo diario alcanzado!');
    }

    // Hidratación perfecta
    if (analysis.achievementPercentage >= 100 && analysis.achievementPercentage <= 105) {
      achievements.push('💎 ¡Hidratación perfecta!');
    }

    // Super hidratado
    if (analysis.achievementPercentage >= 120) {
      achievements.push('🌊 ¡Super hidratado!');
    }

    // Primera vez del día
    if (analysis.totalMl <= 500) {
      achievements.push('🌅 ¡Primer vaso del día!');
    }

    return achievements;
  }
}