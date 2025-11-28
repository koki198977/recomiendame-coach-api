import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { EmotionalLog } from '../../../domain/chapi/entities';
import { CHAPI_AGENT, ChapiAgentPort } from '../ports/out.chapi-agent.port';
import { PROFILE_REPO, ProfileRepoPort } from '../../profile/ports/out.profile-repo.port';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export interface ProcessEmotionalCheckinInput {
  userId: string;
  message: string;
}

export interface ProcessEmotionalCheckinOutput {
  logId: string;
  emotion: string;
  advice: string;
  actions: any[];
}

@Injectable()
export class ProcessEmotionalCheckinUseCase {
  constructor(
    @Inject(CHAPI_AGENT) private readonly agent: ChapiAgentPort,
    @Inject(PROFILE_REPO) private readonly profiles: ProfileRepoPort,
    private readonly prisma: PrismaService, // Direct Prisma usage for simplicity in this MVP
  ) {}

  async execute(
    input: ProcessEmotionalCheckinInput,
  ): Promise<Result<ProcessEmotionalCheckinOutput>> {
    const profile = await this.profiles.get(input.userId);

    // 1. Analyze with AI
    const analysis = await this.agent.analyzeMood({
      userId: input.userId,
      message: input.message,
      userProfile: profile,
    });

    // 2. Save Log
    const log = await this.prisma.emotionalLog.create({
      data: {
        userId: input.userId,
        message: input.message,
        emotion: analysis.emotion,
        advice: analysis.neuroscience,
        actions: analysis.actions as any, // JSON
      },
    });

    return ok({
      logId: log.id,
      emotion: log.emotion,
      advice: log.advice,
      actions: analysis.actions,
    });
  }
}
