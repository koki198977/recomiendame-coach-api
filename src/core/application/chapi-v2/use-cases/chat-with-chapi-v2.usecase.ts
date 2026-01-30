import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { ConversationMessage, ChapiV2Response } from '../../../domain/chapi-v2/entities/conversation.entity';
import { CHAPI_V2_AGENT, ChapiV2AgentPort } from '../ports/out.chapi-v2-agent.port';
import { CONVERSATION_MEMORY, ConversationMemoryPort } from '../ports/out.conversation-memory.port';
import { USER_PROFILE_AGGREGATOR, UserProfileAggregatorPort } from '../ports/out.user-profile-aggregator.port';
import { v4 as uuidv4 } from 'uuid';

export interface ChatWithChapiV2Input {
  userId: string;
  message: string;
  sessionId?: string;
}

export interface ChatWithChapiV2Output {
  response: ChapiV2Response;
  conversationId: string;
  sessionId: string;
}

@Injectable()
export class ChatWithChapiV2UseCase {
  constructor(
    @Inject(CHAPI_V2_AGENT) private readonly chapiAgent: ChapiV2AgentPort,
    @Inject(CONVERSATION_MEMORY) private readonly conversationMemory: ConversationMemoryPort,
    @Inject(USER_PROFILE_AGGREGATOR) private readonly profileAggregator: UserProfileAggregatorPort,
  ) {}

  async execute(input: ChatWithChapiV2Input): Promise<Result<ChatWithChapiV2Output>> {
    try {
      const { userId, message, sessionId = uuidv4() } = input;

      // 1. Obtener el perfil completo del usuario
      const userProfile = await this.profileAggregator.getCompleteUserProfile(userId);

      // 2. Obtener el contexto conversacional
      let conversationContext = await this.conversationMemory.getUserConversationContext(userId);
      
      // Si no existe contexto, crear uno nuevo
      if (!conversationContext) {
        conversationContext = {
          userId,
          totalMessages: 0,
          firstInteraction: new Date(),
          lastInteraction: new Date(),
          conversationSummary: '',
          userPersonality: {
            communicationStyle: 'friendly',
            preferredTopics: [],
            emotionalPatterns: [],
            motivationTriggers: [],
          },
          currentSession: {
            sessionId,
            startedAt: new Date(),
            context: 'new_conversation',
            mood: 'neutral',
          },
        };
      } else {
        // Actualizar sesión actual si es nueva
        if (conversationContext.currentSession.sessionId !== sessionId) {
          conversationContext.currentSession = {
            sessionId,
            startedAt: new Date(),
            context: 'continuing_conversation',
            mood: 'neutral',
          };
        }
      }

      // 3. Guardar el mensaje del usuario
      const userMessage: ConversationMessage = {
        id: uuidv4(),
        userId,
        role: 'user',
        content: message,
        timestamp: new Date(),
        messageType: 'text',
        metadata: {
          sessionId,
        },
      };

      await this.conversationMemory.saveMessage(userMessage);

      // 4. Generar respuesta personalizada con IA
      const chapiResponse = await this.chapiAgent.generatePersonalizedResponse({
        userMessage: message,
        userProfile,
        conversationContext,
      });

      // 5. Guardar la respuesta del asistente
      const assistantMessage: ConversationMessage = {
        id: uuidv4(),
        userId,
        role: 'assistant',
        content: chapiResponse.message,
        timestamp: new Date(),
        messageType: chapiResponse.messageType,
        metadata: {
          sessionId,
          personalizedInsights: chapiResponse.personalizedInsights,
          actions: chapiResponse.actions,
          followUpSuggestions: chapiResponse.followUpSuggestions,
        },
      };

      await this.conversationMemory.saveMessage(assistantMessage);

      // 6. Actualizar contexto conversacional
      const updatedContext = await this.chapiAgent.updateConversationContext({
        userId,
        userMessage: message,
        assistantResponse: chapiResponse,
        currentContext: conversationContext,
      });

      await this.conversationMemory.updateUserConversationContext(updatedContext);

      return ok({
        response: chapiResponse,
        conversationId: assistantMessage.id,
        sessionId,
      });

    } catch (error) {
      console.error('Error in ChatWithChapiV2UseCase:', error);
      return err(new Error('Error al procesar la conversación con Chapi'));
    }
  }
}