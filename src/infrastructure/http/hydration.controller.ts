import { Body, Controller, Get, Post, Put, Delete, Param, Query, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogWaterIntakeUseCase } from '../../core/application/hydration/use-cases/log-water-intake.usecase';
import { GetHydrationStatsUseCase } from '../../core/application/hydration/use-cases/get-hydration-stats.usecase';
import { SetHydrationGoalUseCase } from '../../core/application/hydration/use-cases/set-hydration-goal.usecase';
import { CalculateRecommendedHydrationUseCase } from '../../core/application/hydration/use-cases/calculate-recommended-hydration.usecase';
import { PrismaService } from '../database/prisma.service';

@Controller('hydration')
@UseGuards(JwtAuthGuard)
export class HydrationController {
  constructor(
    private readonly logWaterIntake: LogWaterIntakeUseCase,
    private readonly getHydrationStats: GetHydrationStatsUseCase,
    private readonly setHydrationGoal: SetHydrationGoalUseCase,
    private readonly calculateRecommended: CalculateRecommendedHydrationUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('log')
  async logWater(
    @Body() body: { ml: number; date?: string },
    @Request() req: any
  ) {
    const userId = req.user.userId ?? req.user.sub;
    
    try {
      const result = await this.logWaterIntake.execute({
        userId,
        ml: body.ml,
        date: body.date ? new Date(body.date) : undefined,
      });

      if (result.ok) {
        return result.value;
      } else {
        // Manejar el error correctamente con BadRequestException
        const error = result.error;
        throw new BadRequestException(error.message || 'Error al registrar hidratación');
      }
    } catch (error: any) {
      console.error('❌ Error en /hydration/log:', error.message);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Error al registrar hidratación');
    }
  }

  @Get('stats')
  async getStats(
    @Request() req: any,
    @Query('period') period?: 'TODAY' | 'WEEK' | 'MONTH',
    @Query('date') date?: string
  ) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.getHydrationStats.execute({
      userId,
      period,
      date: date ? new Date(date) : undefined,
    });

    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  @Post('goal')
  async setGoal(
    @Body() body: {
      dailyTargetMl?: number;
      reminderIntervalMinutes?: number;
      startTime?: string;
      endTime?: string;
      isActive?: boolean;
      autoCalculate?: boolean;
    },
    @Request() req: any
  ) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.setHydrationGoal.execute({
      userId,
      ...body,
    });

    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  @Get('quick-log/:ml')
  async quickLog(
    @Param('ml') ml: string,
    @Request() req: any
  ) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.logWaterIntake.execute({
      userId,
      ml: parseInt(ml),
    });

    if (result.ok) {
      return {
        success: true,
        message: result.value.message,
        totalToday: result.value.dailyAnalysis.totalMl,
        percentage: result.value.dailyAnalysis.achievementPercentage,
        remaining: result.value.dailyAnalysis.remainingMl,
        achievements: result.value.achievements,
        nextSuggestion: this.getNextSuggestion(result.value.dailyAnalysis.remainingMl),
      };
    } else {
      throw result.error;
    }
  }

  @Post('quick-actions')
  async quickActions(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    
    // Obtener estado actual
    const statsResult = await this.getHydrationStats.execute({ userId });
    
    if (statsResult.ok) {
      const analysis = statsResult.value.dailyAnalysis;
      
      return {
        currentStatus: {
          totalMl: analysis.totalMl,
          targetMl: analysis.targetMl,
          percentage: analysis.achievementPercentage,
          remaining: analysis.remainingMl,
          status: analysis.status
        },
        quickActions: [
          {
            id: 'small_glass',
            label: 'Vaso pequeño',
            ml: 200,
            icon: '🥃',
            description: 'Vaso de agua pequeño'
          },
          {
            id: 'standard_glass',
            label: 'Vaso estándar',
            ml: 250,
            icon: '🥛',
            description: 'Vaso de agua normal'
          },
          {
            id: 'large_glass',
            label: 'Vaso grande',
            ml: 350,
            icon: '🍺',
            description: 'Vaso de agua grande'
          },
          {
            id: 'bottle',
            label: 'Botella',
            ml: 500,
            icon: '🍼',
            description: 'Botella de agua'
          },
          {
            id: 'large_bottle',
            label: 'Botella grande',
            ml: 750,
            icon: '🍾',
            description: 'Botella de agua grande'
          },
          {
            id: 'liter',
            label: '1 Litro',
            ml: 1000,
            icon: '🧴',
            description: 'Botella de 1 litro'
          }
        ],
        smartSuggestion: this.getSmartSuggestion(analysis),
        motivationalMessage: this.getMotivationalMessage(analysis)
      };
    } else {
      throw statsResult.error;
    }
  }

  @Post('custom-log')
  async customLog(
    @Body() body: { ml: number; description?: string; time?: string },
    @Request() req: any
  ) {
    const userId = req.user.userId ?? req.user.sub;
    const logTime = body.time ? new Date(body.time) : new Date();
    
    const result = await this.logWaterIntake.execute({
      userId,
      ml: body.ml,
      date: logTime,
    });

    if (result.ok) {
      return {
        success: true,
        log: result.value.log,
        message: result.value.message,
        dailyProgress: {
          totalMl: result.value.dailyAnalysis.totalMl,
          targetMl: result.value.dailyAnalysis.targetMl,
          percentage: result.value.dailyAnalysis.achievementPercentage,
          remaining: result.value.dailyAnalysis.remainingMl,
          status: result.value.dailyAnalysis.status
        },
        achievements: result.value.achievements,
        insights: result.value.dailyAnalysis.insights
      };
    } else {
      throw result.error;
    }
  }

  @Get('reminders')
  async getReminders(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.getHydrationStats.execute({ userId });

    if (result.ok) {
      return {
        nextReminder: result.value.nextReminder,
        goal: result.value.goal,
        currentStatus: {
          ml: result.value.dailyAnalysis.totalMl,
          percentage: result.value.dailyAnalysis.achievementPercentage,
          remaining: result.value.dailyAnalysis.remainingMl,
        },
      };
    } else {
      throw result.error;
    }
  }

  @Get('calculate-recommended')
  async calculateRecommendedHydration(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.calculateRecommended.execute({ userId });

    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  @Delete('goal')
  async deleteHydrationGoal(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    
    try {
      // Eliminar objetivo usando raw SQL
      await this.prisma.$executeRaw`
        UPDATE "User" SET "hydrationGoal" = NULL WHERE id = ${userId}
      `;

      return {
        success: true,
        message: 'Objetivo de hidratación eliminado correctamente',
        userId,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error eliminando objetivo de hidratación',
        error: error.message,
      };
    }
  }

  @Get('plan-status')
  async getHydrationPlanStatus(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    
    // Verificar si tiene plan configurado
    const statsResult = await this.getHydrationStats.execute({ userId });
    
    if (statsResult.ok) {
      const hasGoal = statsResult.value.goal !== null;
      const goal = statsResult.value.goal;
      
      return {
        hasPlan: hasGoal,
        goal: goal ? {
          dailyTargetMl: goal.dailyTargetMl,
          isActive: goal.isActive,
          reminderIntervalMinutes: goal.reminderIntervalMinutes,
          startTime: goal.startTime,
          endTime: goal.endTime,
        } : null,
        currentProgress: statsResult.value.dailyAnalysis,
        recommendations: hasGoal ? [] : [
          'Configura tu objetivo personalizado de hidratación',
          'Basado en tu peso y actividad física',
          'Recibe recordatorios inteligentes',
        ],
        nextSteps: hasGoal ? [
          'Registra tu consumo de agua',
          'Mantén tu objetivo diario',
          'Revisa tus estadísticas',
        ] : [
          'Calcula tu objetivo recomendado',
          'Configura recordatorios',
          'Comienza a registrar tu consumo',
        ],
      };
    } else {
      throw statsResult.error;
    }
  }

  @Get('suggestion')
  async getHydrationSuggestion(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    
    // Primero calcular la recomendación personalizada
    const recommendedResult = await this.calculateRecommended.execute({ userId });
    
    if (recommendedResult.ok) {
      const recommended = recommendedResult.value;
      
      return {
        shouldSuggest: true,
        opportunity: {
          type: 'ONBOARDING',
          priority: 'HIGH',
          title: '💧 ¡Personalicemos tu hidratación!',
          message: recommended.explanation,
          suggestedGoalMl: recommended.recommendedMl,
          ranges: recommended.ranges,
          benefits: [
            '💧 Mejora tu energía y concentración',
            '🔥 Acelera tu metabolismo',
            '✨ Mejora la apariencia de tu piel',
            '💪 Optimiza tu rendimiento físico'
          ],
          tips: recommended.tips,
          setupSteps: [
            { step: 1, title: 'Confirma tu objetivo', description: `Acepta ${(recommended.recommendedMl/1000).toFixed(1)}L o ajústalo` },
            { step: 2, title: 'Configura recordatorios', description: 'Cada 2 horas' },
            { step: 3, title: 'Define horario', description: '7:00 AM - 10:00 PM' },
            { step: 4, title: '¡Comienza!', description: 'Registra tu primer vaso' }
          ],
          callToAction: 'Configurar mi hidratación'
        }
      };
    } else {
      // Fallback si no se puede calcular
      return {
        shouldSuggest: true,
        opportunity: {
          type: 'ONBOARDING',
          priority: 'MEDIUM',
          title: '💧 ¡Comencemos con la hidratación!',
          message: 'Te recomiendo empezar con 2L diarios y ajustar según tus necesidades.',
          suggestedGoalMl: 2000,
          callToAction: 'Configurar hidratación básica'
        }
      };
    }
  }

  private getNextSuggestion(remainingMl: number): { ml: number; message: string } {
    if (remainingMl <= 0) {
      return { ml: 0, message: '🎉 ¡Objetivo completado!' };
    }
    
    if (remainingMl <= 250) {
      return { ml: remainingMl, message: `¡Solo ${remainingMl}ml más para completar tu objetivo!` };
    }
    
    if (remainingMl <= 500) {
      return { ml: 250, message: 'Un vaso más te acerca mucho a tu objetivo' };
    }
    
    return { ml: 500, message: 'Una botella de agua te ayudará bastante' };
  }

  private getSmartSuggestion(analysis: any): { ml: number; reason: string; urgency: string } {
    const currentHour = new Date().getHours();
    const percentage = analysis.achievementPercentage;
    
    if (percentage < 30 && currentHour > 14) {
      return {
        ml: 500,
        reason: 'Estás muy por debajo de tu objetivo y ya es tarde',
        urgency: 'HIGH'
      };
    }
    
    if (percentage < 50 && currentHour > 12) {
      return {
        ml: 350,
        reason: 'Necesitas acelerar el ritmo para alcanzar tu objetivo',
        urgency: 'MEDIUM'
      };
    }
    
    if (percentage >= 80) {
      return {
        ml: 200,
        reason: 'Vas excelente, mantén el ritmo con sorbos pequeños',
        urgency: 'LOW'
      };
    }
    
    return {
      ml: 250,
      reason: 'Ritmo perfecto, continúa así',
      urgency: 'LOW'
    };
  }

  private getMotivationalMessage(analysis: any): string {
    const messages = {
      EXCELLENT: [
        '🌟 ¡Increíble! Estás súper hidratado',
        '💎 ¡Perfecto! Tu cuerpo te lo agradece',
        '🏆 ¡Eres un campeón de la hidratación!'
      ],
      GOOD: [
        '👍 ¡Muy bien! Vas por buen camino',
        '💪 ¡Excelente progreso! Sigue así',
        '🎯 ¡Casi lo logras! Un poco más'
      ],
      NEEDS_IMPROVEMENT: [
        '⚡ ¡Vamos! Tu cuerpo necesita más agua',
        '🚀 ¡Acelera el ritmo! Puedes lograrlo',
        '💧 ¡Tu cuerpo te está pidiendo hidratación!'
      ],
      POOR: [
        '🚨 ¡Hora de hidratarte! Es importante',
        '💧 Tu cuerpo necesita agua urgentemente',
        '⏰ ¡No esperes más! Toma agua ahora'
      ]
    };
    
    const statusMessages = messages[analysis.status as keyof typeof messages] || messages.NEEDS_IMPROVEMENT;
    return statusMessages[Math.floor(Math.random() * statusMessages.length)];
  }
}