import { Module } from '@nestjs/common';
import { HydrationController } from '../infrastructure/http/hydration.controller';
import { LogWaterIntakeUseCase } from '../core/application/hydration/use-cases/log-water-intake.usecase';
import { GetHydrationStatsUseCase } from '../core/application/hydration/use-cases/get-hydration-stats.usecase';
import { SetHydrationGoalUseCase } from '../core/application/hydration/use-cases/set-hydration-goal.usecase';
import { CalculateRecommendedHydrationUseCase } from '../core/application/hydration/use-cases/calculate-recommended-hydration.usecase';
import { HYDRATION_REPO } from '../core/application/hydration/ports/out.hydration-repo.port';
import { HYDRATION_ANALYZER } from '../core/application/hydration/ports/out.hydration-analyzer.port';
import { HydrationPrismaRepository } from '../infrastructure/persistence/prisma/hydration.prisma.repository';
import { HydrationAnalyzerService } from '../infrastructure/ai/hydration-analyzer.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { ProfileModule } from './profile.module';
import { NotificationsModule } from './notifications.module';

@Module({
  imports: [PrismaModule, ProfileModule, NotificationsModule],
  controllers: [HydrationController],
  providers: [
    LogWaterIntakeUseCase,
    GetHydrationStatsUseCase,
    SetHydrationGoalUseCase,
    CalculateRecommendedHydrationUseCase,
    { provide: HYDRATION_REPO, useClass: HydrationPrismaRepository },
    { provide: HYDRATION_ANALYZER, useClass: HydrationAnalyzerService },
  ],
  exports: [HYDRATION_ANALYZER], // Para usar en Chapi
})
export class HydrationModule {}