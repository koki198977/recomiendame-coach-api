import { ConversationMessage, UserConversationContext } from '../../../domain/chapi-v2/entities/conversation.entity';

export const CONVERSATION_MEMORY = 'CONVERSATION_MEMORY';

export interface ConversationMemoryPort {
  /**
   * Guarda un mensaje en el historial conversacional
   */
  saveMessage(message: ConversationMessage): Promise<void>;

  /**
   * Obtiene el historial completo de conversaciones de un usuario
   */
  getConversationHistory(userId: string, limit?: number): Promise<ConversationMessage[]>;

  /**
   * Obtiene el contexto conversacional completo del usuario
   */
  getUserConversationContext(userId: string): Promise<UserConversationContext | null>;

  /**
   * Actualiza el contexto conversacional del usuario
   */
  updateUserConversationContext(context: UserConversationContext): Promise<void>;

  /**
   * Busca conversaciones por contenido o metadata
   */
  searchConversations(params: {
    userId: string;
    query?: string;
    emotion?: string;
    dateRange?: { from: Date; to: Date };
    messageType?: string;
  }): Promise<ConversationMessage[]>;

  /**
   * Obtiene estadísticas conversacionales del usuario
   */
  getConversationStats(userId: string): Promise<{
    totalMessages: number;
    averageMessagesPerDay: number;
    mostCommonEmotions: { emotion: string; count: number }[];
    mostDiscussedTopics: { topic: string; count: number }[];
    conversationTrends: any[];
  }>;

  /**
   * Genera un resumen inteligente de conversaciones pasadas
   */
  generateConversationSummary(userId: string, timeframe?: 'week' | 'month' | 'all'): Promise<string>;
}