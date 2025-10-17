import { Module } from '@nestjs/common';
import { MeController } from '../infrastructure/http/me.controller';
import { GetMyStatsUseCase } from '../core/application/stats/use-cases/get-my-stats.usecase';

import { STREAK_REPOSITORY } from '../core/application/stats/ports/out.streak-repository.port';
import { StreakPrismaRepository } from '../infrastructure/persistence/prisma/streak.prisma.repository';

import { POINTS_LEDGER_PORT } from '../core/application/stats/ports/out.points-ledger.port';
import { PointsLedgerPrismaRepository } from '../infrastructure/persistence/prisma/points-ledger.prisma.repository';

import { ACHIEVEMENT_PORT } from '../core/application/achievements/ports/out.achievement.port';
import { AchievementPrismaRepository } from '../infrastructure/persistence/prisma/achievement.prisma.repository';
import { MeMacrosController } from 'src/infrastructure/http/me.macros.controller';
import { MacrosService } from 'src/core/application/plans/services/macros.service';
import { ProfilesPrismaRepository } from 'src/infrastructure/persistence/prisma/profiles.prisma.repository';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

@Module({
  controllers: [MeController, MeMacrosController],
  providers: [
    GetMyStatsUseCase,
    MacrosService,
    ProfilesPrismaRepository,
    PrismaService,
    { provide: STREAK_REPOSITORY, useClass: StreakPrismaRepository },
    { provide: POINTS_LEDGER_PORT, useClass: PointsLedgerPrismaRepository },
    { provide: ACHIEVEMENT_PORT, useClass: AchievementPrismaRepository },
  ],
})
export class MeModule {}
