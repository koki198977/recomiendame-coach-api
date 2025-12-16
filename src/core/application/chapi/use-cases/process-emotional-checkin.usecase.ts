import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { EmotionalLog, ChapiContextualResponse } from '../../../domain/chapi/entities';
import { CHAPI_AGENT, ChapiAgentPort } from '../ports/out.chapi-agent.port';
import { CHAPI_CONTEXT_MANAGER, ChapiContextManagerPort } from '../ports/out.chapi-context.port';
import { PROFILE_REPO, ProfileRepoPort } from '../../profile/ports/out.profile-repo.port';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

export interface ProcessEmotionalCheckinInput {
  userId: string;
  message: string;
}

export interface ProcessEmotionalCheckinOutput {
  type: string;
  message: string;
  emotionalAnalysis?: {
    logId?: string;
    emotion: string;
    advice: string;
    actions: any[];
  };
  suggestions?: string[];
  followUpQuestions?: string[];
}

@Injectable()
export class ProcessEmotionalCheckinUseCase {
  constructor(
    @Inject(CHAPI_AGENT) private readonly agent: ChapiAgentPort,
    @Inject(CHAPI_CONTEXT_MANAGER) private readonly contextManager: ChapiContextManagerPort,
    @Inject(PROFILE_REPO) private readonly profiles: ProfileRepoPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    input: ProcessEmotionalCheckinInput,
  ): Promise<Result<ProcessEmotionalCheckinOutput>> {
    try {
      const profile = await this.profiles.get(input.userId);
      
      // 1. Get conversation context
      const context = await this.contextManager.getContext(input.userId) || {
        userId: input.userId,
        lastInteractionType: 'FIRST_TIME',
        conversationHistory: [],
        sessionStarted: new Date(),
      };

      // 2. Classify the message type
      const classification = await this.contextManager.classifyMessage({
        message: input.message,
        userId: input.userId,
        context,
      });

      // 3. Generate contextual response
      const response = await this.contextManager.generateContextualResponse({
        message: input.message,
        userId: input.userId,
        classification,
        context,
        userProfile: profile,
      });

      // 4. Save emotional log only if it's an emotional analysis
      let logId: string | undefined;
      if (response.emotionalAnalysis) {
        const log = await this.prisma.emotionalLog.create({
          data: {
            userId: input.userId,
            message: input.message,
            emotion: response.emotionalAnalysis.emotion,
            advice: response.emotionalAnalysis.neuroscience,
            actions: response.emotionalAnalysis.actions as any,
          },
        });
        logId = log.id;
      }

      // 5. Update conversation context
      await this.contextManager.updateContext({
        userId: input.userId,
        message: input.message,
        classification,
        response,
      });

      // 6. Format response
      const output: ProcessEmotionalCheckinOutput = {
        type: response.type,
        message: response.message,
        suggestions: response.suggestions,
        followUpQuestions: response.followUpQuestions,
      };

      if (response.emotionalAnalysis) {
        output.emotionalAnalysis = {
          logId,
          emotion: response.emotionalAnalysis.emotion,
          advice: response.emotionalAnalysis.neuroscience,
          actions: response.emotionalAnalysis.actions,
        };
      }

      return ok(output);
    } catch (error) {
      return err(error);
    }
  }
}
