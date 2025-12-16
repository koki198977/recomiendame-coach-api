import { Body, Controller, Post, Get, Request, UseGuards, Query } from '@nestjs/common';
import { ProcessEmotionalCheckinUseCase } from '../../core/application/chapi/use-cases/process-emotional-checkin.usecase';
import { AnalyzeUserHealthUseCase } from '../../core/application/chapi/use-cases/analyze-user-health.usecase';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chapi')
@UseGuards(JwtAuthGuard)
export class ChapiController {
  constructor(
    private readonly processCheckin: ProcessEmotionalCheckinUseCase,
    private readonly analyzeHealth: AnalyzeUserHealthUseCase,
  ) {}

  @Post('check-in')
  async checkIn(@Body() body: { message: string }, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const result = await this.processCheckin.execute({
      userId,
      message: body.message,
    });

    if (result.ok) {
      return result.value;
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
