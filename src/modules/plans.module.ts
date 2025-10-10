import { Module } from '@nestjs/common';
import { PlansController } from '../infrastructure/http/plans.controller';
import { GenerateWeeklyPlanUseCase } from '../core/application/plans/use-cases/generate-weekly-plan.usecase';
import { PLAN_REPOSITORY } from '../core/application/plans/ports/out.plan-repository.port';
import { PlanPrismaRepository } from '../infrastructure/persistence/prisma/plan.prisma.repository';
import { MEAL_PLANNER_AGENT } from '../core/application/plans/ports/out.meal-planner-agent.port';
import { FakeMealPlannerAgent } from '../infrastructure/ai/meal-planner.agent.fake';
import { NOTIFICATION_PORT } from '../core/application/plans/ports/out.notification.port';
import { InAppNotificationAdapter } from '../infrastructure/notifications/inapp.notification.adapter';
import { GetPlanByIdUseCase } from 'src/core/application/plans/use-cases/get-plan-by-id.usecase';
import { GetPlanByWeekUseCase } from 'src/core/application/plans/use-cases/get-plan-by-week.usecase';

@Module({
  controllers: [PlansController],
  providers: [
    GenerateWeeklyPlanUseCase,
    GetPlanByIdUseCase,
    GetPlanByWeekUseCase,
    { provide: PLAN_REPOSITORY, useClass: PlanPrismaRepository },
    { provide: MEAL_PLANNER_AGENT, useClass: FakeMealPlannerAgent },
    { provide: NOTIFICATION_PORT, useClass: InAppNotificationAdapter },
  ],
  exports: [],
})
export class PlansModule {}
