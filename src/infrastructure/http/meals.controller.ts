import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogMealDto } from '../../core/application/meals/dto/log-meal.dto';
import { AnalyzeMealDto } from '../../core/application/meals/dto/analyze-meal.dto';
import { LogMealUseCase } from '../../core/application/meals/use-cases/log-meal.usecase';
import { GetMealsTodayUseCase } from '../../core/application/meals/use-cases/get-meals-today.usecase';
import { MarkMealConsumedUseCase } from '../../core/application/meals/use-cases/mark-meal-consumed.usecase';
import { AnalyzeMealImageUseCase } from '../../core/application/meals/use-cases/analyze-meal-image.usecase';
import { DeleteMealLogUseCase } from '../../core/application/meals/use-cases/delete-meal-log.usecase';
import { NotificationTriggersService } from '../../modules/notification-triggers.service';
import { HealthAwareNotificationsService } from '../../modules/health-aware-notifications.service';

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealsController {
  constructor(
    private readonly logMeal: LogMealUseCase,
    private readonly getMealsToday: GetMealsTodayUseCase,
    private readonly markMealConsumed: MarkMealConsumedUseCase,
    private readonly analyzeMealImage: AnalyzeMealImageUseCase,
    private readonly deleteMealLog: DeleteMealLogUseCase,
    private readonly notificationTriggers: NotificationTriggersService,
    private readonly healthAwareNotifications: HealthAwareNotificationsService,
  ) {}

  @Post('log')
  async log(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: LogMealDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId ?? req.user.sub;
    
    // 1. Registrar la comida
    const result = await this.logMeal.execute(userId, dto);
    
    // 2. 🔔 TRIGGERS INMEDIATOS DE NOTIFICACIONES
    try {
      // Verificar balance nutricional
      await this.notificationTriggers.checkNutritionalBalance(userId);
      
      // Verificar condiciones de salud (diabetes, alergias, etc.)
      await this.healthAwareNotifications.checkHealthConditionCompliance(userId);
      
      console.log(`✅ Notificaciones procesadas para usuario ${userId}`);
    } catch (error) {
      console.error('❌ Error procesando notificaciones:', error);
      // No fallar el endpoint principal por errores de notificaciones
    }
    
    return result;
  }

  @Get('today')
  async today(@Query('date') date: string | undefined, @Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    return this.getMealsToday.execute(userId, date);
  }

  @Patch(':id/consumed')
  async markConsumed(
    @Param('id') mealId: string,
    @Query('date') date: string | undefined,
    @Request() req: any,
  ) {
    const userId = req.user.userId ?? req.user.sub;
    return this.markMealConsumed.execute(userId, mealId, date);
  }

  @Post('analyze')
  async analyze(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: AnalyzeMealDto,
  ) {
    return this.analyzeMealImage.execute(dto.imageUrl, dto.description);
  }

  @Delete(':id')
  async delete(
    @Param('id') mealLogId: string,
    @Request() req: any,
  ) {
    const userId = req.user.userId ?? req.user.sub;
    return this.deleteMealLog.execute(userId, mealLogId);
  }
}
