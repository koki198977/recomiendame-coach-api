import {
  Body,
  Controller,
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

@Controller('meals')
@UseGuards(JwtAuthGuard)
export class MealsController {
  constructor(
    private readonly logMeal: LogMealUseCase,
    private readonly getMealsToday: GetMealsTodayUseCase,
    private readonly markMealConsumed: MarkMealConsumedUseCase,
    private readonly analyzeMealImage: AnalyzeMealImageUseCase,
  ) {}

  @Post('log')
  async log(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: LogMealDto,
    @Request() req: any,
  ) {
    const userId = req.user.userId ?? req.user.sub;
    return this.logMeal.execute(userId, dto);
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
}
