import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { GAMIFICATION_REPO } from '../core/application/gamification/ports/out.gamification-repo.port';
import { GamificationPrismaRepository } from '../infrastructure/persistence/prisma/gamification.prisma.repository';
import { OnCheckinConfirmedUseCase } from '../core/application/gamification/use-cases/on-checkin-confirmed.usecase';
import { GetMyGamificationUseCase } from '../core/application/gamification/use-cases/get-my-gamification.usecase';
import { ListMyPointsUseCase } from '../core/application/gamification/use-cases/list-my-points.usecase';
import { MeGamificationController } from '../infrastructure/http/me.gamification.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MeGamificationController],
  providers: [
    { provide: GAMIFICATION_REPO, useClass: GamificationPrismaRepository },
    OnCheckinConfirmedUseCase,
    GetMyGamificationUseCase,
    ListMyPointsUseCase,
  ],
  exports: [OnCheckinConfirmedUseCase, GetMyGamificationUseCase, ListMyPointsUseCase],
})
export class GamificationModule {}
