import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { ConversationMessage } from '../../../domain/chapi-v2/entities/conversation.entity';
import { CONVERSATION_MEMORY, ConversationMemoryPort } from '../ports/out.conversation-memory.port';

export interface GetConversationHistoryInput {
  userId: string;
  limit?: number;
  searchQuery?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface GetConversationHistoryOutput {
  messages: ConversationMessage[];
  totalCount: number;
  conversationStats: {
    totalMessages: number;
    averageMessagesPerDay: number;
    mostCommonEmotions: { emotion: string; count: number }[];
    mostDiscussedTopics: { topic: string; count: number }[];
  };
  conversationSummary: string;
}

@Injectable()
export class GetConversationHistoryUseCase {
  constructor(
    @Inject(CONVERSATION_MEMORY) private readonly conversationMemory: ConversationMemoryPort,
  ) {}

  async execute(input: GetConversationHistoryInput): Promise<Result<GetConversationHistoryOutput>> {
    try {
      const { userId, limit = 50, searchQuery, dateRange } = input;

      // 1. Obtener mensajes según los filtros
      let messages: ConversationMessage[];
      
      if (searchQuery || dateRange) {
        messages = await this.conversationMemory.searchConversations({
          userId,
          query: searchQuery,
          dateRange,
        });
        
        // Aplicar límite si es necesario
        if (limit && messages.length > limit) {
          messages = messages.slice(0, limit);
        }
      } else {
        messages = await this.conversationMemory.getConversationHistory(userId, limit);
      }

      // 2. Obtener estadísticas conversacionales
      const conversationStats = await this.conversationMemory.getConversationStats(userId);

      // 3. Generar resumen de conversaciones
      const conversationSummary = await this.conversationMemory.generateConversationSummary(
        userId,
        dateRange ? 'month' : 'all'
      );

      return ok({
        messages,
        totalCount: messages.length,
        conversationStats,
        conversationSummary,
      });

    } catch (error) {
      console.error('Error in GetConversationHistoryUseCase:', error);
      return err(new Error('Error al obtener el historial de conversaciones'));
    }
  }
}