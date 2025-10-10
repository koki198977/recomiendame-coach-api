import { Module } from '@nestjs/common';
import { CheckinsController } from '../infrastructure/http/checkins.controller';
import { UpsertCheckinUseCase } from '../core/application/checkins/use-cases/upsert-checkin.usecase';
import { ListCheckinsUseCase } from '../core/application/checkins/use-cases/list-checkins.usecase';
import { CHECKIN_REPOSITORY } from '../core/application/checkins/ports/out.checkin-repository.port';
import { CheckinPrismaRepository } from '../infrastructure/persistence/prisma/checkin.prisma.repository';

import { STREAK_REPOSITORY } from '../core/application/stats/ports/out.streak-repository.port';
import { StreakPrismaRepository } from '../infrastructure/persistence/prisma/streak.prisma.repository';

import { POINTS_LEDGER_PORT } from '../core/application/stats/ports/out.points-ledger.port';
import { PointsLedgerPrismaRepository } from '../infrastructure/persistence/prisma/points-ledger.prisma.repository';

import { ACHIEVEMENT_PORT } from '../core/application/achievements/ports/out.achievement.port';
import { AchievementPrismaRepository } from '../infrastructure/persistence/prisma/achievement.prisma.repository';

@Module({
  controllers: [CheckinsController],
  providers: [
    UpsertCheckinUseCase,
    ListCheckinsUseCase,
    { provide: CHECKIN_REPOSITORY, useClass: CheckinPrismaRepository },

    { provide: STREAK_REPOSITORY, useClass: StreakPrismaRepository },
    { provide: POINTS_LEDGER_PORT, useClass: PointsLedgerPrismaRepository },
    { provide: ACHIEVEMENT_PORT, useClass: AchievementPrismaRepository },
  ],
})
export class CheckinsModule {}
