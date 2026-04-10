import { Body, Controller, Post, Get, Request, UseGuards, Query, UseInterceptors, ForbiddenException } from '@nestjs/common';
import { ProcessEmotionalCheckinUseCase } from '../../core/application/chapi/use-cases/process-emotional-checkin.usecase';
import { AnalyzeUserHealthUseCase } from '../../core/application/chapi/use-cases/analyze-user-health.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChapiLegacyInterceptor } from './chapi-legacy.interceptor';
import { UsageLimitService } from '../../core/application/plan/usage-limit.service';
import { FEATURE_GATES } from '../../core/application/plan/feature-gates';

@Controller('chapi')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ChapiLegacyInterceptor)
export class ChapiController {
  constructor(
    private readonly processCheckin: ProcessEmotionalCheckinUseCase,
    private readonly analyzeHealth: AnalyzeUserHealthUseCase,
    private readonly usageLimitService: UsageLimitService,
  ) {}

  @Post('check-in')
  async checkIn(@Body() body: { message: string }, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;

    if (req.user?.plan !== 'PRO') {
      const gate = FEATURE_GATES['chapi_basic'];
      const check = await this.usageLimitService.checkAndIncrement(
        userId, 'chapi_basic', gate.limit!, gate.window!,
      );
      if (!check.allowed) {
        throw new ForbiddenException({
          message: `Límite de mensajes alcanzado (${check.limit}/día). Resetea a las ${check.resetsAt.toISOString()}`,
          feature: 'chapi_basic',
          current: check.current,
          limit: check.limit,
          resetsAt: check.resetsAt,
        });
      }
    }

    const result = await this.processCheckin.execute({ userId, message: body.message });

    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  // 🔄 ENDPOINT LEGACY para compatibilidad con apps en producción
  @Post('check-in/legacy')
  async checkInLegacy(@Body() body: { message: string }, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.processCheckin.execute({
      userId,
      message: body.message,
    });

    if (result.ok) {
      const response = result.value;
      
      // Si hay análisis emocional, devolver formato legacy
      if (response.emotionalAnalysis) {
        return {
          logId: response.emotionalAnalysis.logId || '',
          emotion: response.emotionalAnalysis.emotion,
          advice: response.emotionalAnalysis.advice,
          actions: response.emotionalAnalysis.actions.map((action: any) => ({
            title: action.title || action.name || 'Acción recomendada',
            type: action.type || 'PHYSICAL',
            durationMinutes: action.durationMinutes || action.duration || 15,
          })),
        };
      }
      
      // Si no hay análisis emocional, crear respuesta básica compatible
      return {
        logId: '',
        emotion: 'NEUTRAL',
        advice: response.message || 'Gracias por compartir tu estado emocional.',
        actions: [
          {
            title: 'Continuar conversación',
            type: 'MENTAL',
            durationMinutes: 5,
          },
        ],
      };
    } else {
      throw result.error;
    }
  }

  @Get('health-analysis')
  async getHealthAnalysis(
    @Request() req: any,
    @Query('includeNotifications') includeNotifications?: string
  ) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.analyzeHealth.execute({
      userId,
      includeNotifications: includeNotifications === 'true',
    });

    if (result.ok) {
      return result.value;
    } else {
      throw result.error;
    }
  }

  @Get('proactive-notifications')
  async getProactiveNotifications(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.analyzeHealth.execute({
      userId,
      includeNotifications: true,
    });

    if (result.ok) {
      return {
        notifications: result.value.proactiveNotifications || [],
        riskScore: result.value.riskScore,
        summary: {
          totalNotifications: result.value.proactiveNotifications?.length || 0,
          highPriority: result.value.proactiveNotifications?.filter(n => n.priority === 'HIGH').length || 0,
          healthAlerts: result.value.healthAlerts.length,
        }
      };
    } else {
      throw result.error;
    }
  }
}
