import { Body, Controller, Get, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpsertCheckinUseCase } from '../../core/application/checkins/use-cases/upsert-checkin.usecase';
import { ListCheckinsUseCase } from '../../core/application/checkins/use-cases/list-checkins.usecase';
import { GetTodayCheckinUseCase } from '../../core/application/checkins/use-cases/get-today-checkin.usecase';
import { UpsertCheckinDto } from '../../core/application/checkins/dto/upsert-checkin.dto';
import { ListCheckinsDto } from '../../core/application/checkins/dto/list-checkins.dto';
import { NotificationTriggersService } from '../../modules/notification-triggers.service';
import { SmartAnalyticsService } from '../../modules/smart-analytics.service';

@Controller('checkins')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CheckinsController {
  constructor(
    private readonly upsertUC: UpsertCheckinUseCase,
    private readonly listUC: ListCheckinsUseCase,
    private readonly getTodayUC: GetTodayCheckinUseCase,
    private readonly notificationTriggers: NotificationTriggersService,
    private readonly smartAnalytics: SmartAnalyticsService,
  ) {}

  @Post()
  async upsertCheckin(@Req() req: any, @Body() body: any) {
    const userId = req.user.userId;
    
    // 1. Crear/actualizar el check-in
    const result = await this.upsertUC.execute(userId, {
      date: body.date,                // 'YYYY-MM-DD'
      weightKg: body.weightKg ?? null,
      adherencePct: body.adherencePct ?? null,
      hungerLvl: body.hungerLvl ?? null,
      notes: body.notes ?? null,
    });
    
    // 2. 🔔 TRIGGERS INMEDIATOS DE NOTIFICACIONES
    try {
      // Verificar progreso hacia objetivos
      await this.notificationTriggers.checkGoalProgress(userId);
      
      // Analizar patrones inteligentes (correlaciones)
      await this.smartAnalytics.analyzeUserPatterns(userId);
      
      // Verificar riesgo de abandono
      const abandonmentRisk = await this.smartAnalytics.predictAbandonmentRisk(userId);
      console.log(`📊 Riesgo de abandono para ${userId}: ${abandonmentRisk}%`);
      
      console.log(`✅ Análisis de check-in procesado para usuario ${userId}`);
    } catch (error) {
      console.error('❌ Error procesando análisis de check-in:', error);
      // No fallar el endpoint principal
    }
    
    return result;
  }

  @Get('today')
  async getTodayCheckin(@Req() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    return this.getTodayUC.execute(userId);
  }

  @Get()
  list(@Query() q: ListCheckinsDto, @Req() req: any) {
    return this.listUC.execute(req.user.userId, q);
  }
}
