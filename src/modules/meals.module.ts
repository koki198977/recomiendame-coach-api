import { Module } from '@nestjs/common';
import { MealsController } from '../infrastructure/http/meals.controller';
import { LogMealUseCase } from '../core/application/meals/use-cases/log-meal.usecase';
import { GetMealsTodayUseCase } from '../core/application/meals/use-cases/get-meals-today.usecase';
import { MarkMealConsumedUseCase } from '../core/application/meals/use-cases/mark-meal-consumed.usecase';
import { AnalyzeMealImageUseCase } from '../core/application/meals/use-cases/analyze-meal-image.usecase';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [MealsController],
  providers: [
    LogMealUseCase,
    GetMealsTodayUseCase,
    MarkMealConsumedUseCase,
    AnalyzeMealImageUseCase,
  ],
})
export class MealsModule {}
