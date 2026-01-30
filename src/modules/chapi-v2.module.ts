import { Module } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

// Controllers
import { ChapiV2Controller } from '../infrastructure/http/chapi-v2.controller';

// Use Cases
import { ChatWithChapiV2UseCase } from '../core/application/chapi-v2/use-cases/chat-with-chapi-v2.usecase';
import { GetConversationHistoryUseCase } from '../core/application/chapi-v2/use-cases/get-conversation-history.usecase';
import { GetProactiveInsightsUseCase } from '../core/application/chapi-v2/use-cases/get-proactive-insights.usecase';

// Ports and Implementations
import { CHAPI_V2_AGENT } from '../core/application/chapi-v2/ports/out.chapi-v2-agent.port';
import { CONVERSATION_MEMORY } from '../core/application/chapi-v2/ports/out.conversation-memory.port';
import { USER_PROFILE_AGGREGATOR } from '../core/application/chapi-v2/ports/out.user-profile-aggregator.port';

import { OpenAIChapiV2Agent } from '../infrastructure/ai/chapi-v2.agent.openai';
import { ConversationMemoryPrismaRepository } from '../infrastructure/persistence/prisma/conversation-memory.prisma.repository';
import { UserProfileAggregatorPrismaRepository } from '../infrastructure/persistence/prisma/user-profile-aggregator.prisma.repository';

@Module({
  controllers: [ChapiV2Controller],
  providers: [
    // Database
    PrismaService,

    // Use Cases
    ChatWithChapiV2UseCase,
    GetConversationHistoryUseCase,
    GetProactiveInsightsUseCase,

    // Infrastructure Implementations
    {
      provide: CHAPI_V2_AGENT,
      useClass: OpenAIChapiV2Agent,
    },
    {
      provide: CONVERSATION_MEMORY,
      useClass: ConversationMemoryPrismaRepository,
    },
    {
      provide: USER_PROFILE_AGGREGATOR,
      useClass: UserProfileAggregatorPrismaRepository,
    },
  ],
  exports: [
    // Exportar los casos de uso por si otros módulos los necesitan
    ChatWithChapiV2UseCase,
    GetConversationHistoryUseCase,
    GetProactiveInsightsUseCase,
  ],
})
export class ChapiV2Module {}