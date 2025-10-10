import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/database/prisma.module';
import { GamificationModule } from './gamification.module';
import { UpsertCheckinUseCase } from '../core/application/checkins/use-cases/upsert-checkin.usecase';
import { CHECKIN_REPOSITORY } from '../core/application/checkins/ports/out.checkin-repository.port';
import { CheckinPrismaRepository } from '../infrastructure/persistence/prisma/checkin.prisma.repository';
import { CheckinsController } from '../infrastructure/http/checkins.controller';
import { ListCheckinsUseCase } from 'src/core/application/checkins/use-cases/list-checkins.usecase';

@Module({
  imports: [PrismaModule, GamificationModule],
  controllers: [CheckinsController],
  providers: [
    UpsertCheckinUseCase,
    ListCheckinsUseCase,
    { provide: CHECKIN_REPOSITORY, useClass: CheckinPrismaRepository },
  ],
  exports: [UpsertCheckinUseCase],
})
export class CheckinsModule {}
