import { Module } from '@nestjs/common';
import { ChapiController } from '../infrastructure/http/chapi.controller';
import { ProcessEmotionalCheckinUseCase } from '../core/application/chapi/use-cases/process-emotional-checkin.usecase';
import { CHAPI_AGENT } from '../core/application/chapi/ports/out.chapi-agent.port';
import { OpenAIChapiAgent } from '../infrastructure/ai/chapi.agent.openai';
import { PROFILE_REPO } from '../core/application/profile/ports/out.profile-repo.port';
import { ProfilesPrismaRepository } from '../infrastructure/persistence/prisma/profiles.prisma.repository';
import { PrismaModule } from '../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChapiController],
  providers: [
    ProcessEmotionalCheckinUseCase,
    { provide: CHAPI_AGENT, useClass: OpenAIChapiAgent },
    { provide: PROFILE_REPO, useClass: ProfilesPrismaRepository },
  ],
  exports: [],
})
export class ChapiModule {}
