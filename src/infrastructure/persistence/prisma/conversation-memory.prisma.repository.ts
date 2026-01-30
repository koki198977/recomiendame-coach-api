import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConversationMemoryPort } from '../../../core/application/chapi-v2/ports/out.conversation-memory.port';
import { ConversationMessage, UserConversationContext } from '../../../core/domain/chapi-v2/entities/conversation.entity';

@Injectable()
export class ConversationMemoryPrismaRepository implements ConversationMemoryPort {
  constructor(private prisma: PrismaService) {}

  async saveMessage(message: ConversationMessage): Promise<void> {
    // IMPLEMENTACIÓN TEMPORAL: Guardar en chapiContext hasta aplicar migración
    const user = await this.prisma.user.findUnique({
      where: { id: message.userId },
      select: { chapiContext: true },
    });

    const currentContext = (user?.chapiContext as any) || { messages: [] };
    const messages = currentContext.messages || [];
    
    // Mantener solo los últimos 100 mensajes para evitar que crezca demasiado
    messages.push({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      messageType: message.messageType,
      metadata: message.metadata,
    });

    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }

    await this.prisma.user.update({
      where: { id: message.userId },
      data: { 
        chapiContext: {
          ...currentContext,
          messages,
          lastUpdated: new Date().toISOString(),
        }
      },
    });
  }

  async getConversationHistory(userId: string, limit?: number): Promise<ConversationMessage[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { chapiContext: true },
    });

    const context = (user?.chapiContext as any) || { messages: [] };
    const messages = context.messages || [];

    const limitedMessages = limit ? messages.slice(-limit) : messages;

    return limitedMessages.map((msg: any) => ({
      id: msg.id,
      userId,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      messageType: msg.messageType as any,
      metadata: msg.metadata as any,
    }));
  }

  async getUserConversationContext(userId: string): Promise<UserConversationContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { chapiContext: true },
    });

    if (!user?.chapiContext) {
      return null;
    }

    const context = user.chapiContext as any;
    
    // Si ya tiene el formato de UserConversationContext, devolverlo
    if (context.userId && context.totalMessages !== undefined) {
      // Asegurar que las fechas sean objetos Date
      return {
        ...context,
        firstInteraction: new Date(context.firstInteraction),
        lastInteraction: new Date(context.lastInteraction),
        currentSession: {
          ...context.currentSession,
          startedAt: new Date(context.currentSession.startedAt),
        },
      } as UserConversationContext;
    }

    // Si solo tiene mensajes, crear contexto básico
    const messages = context.messages || [];
    return {
      userId,
      totalMessages: messages.length,
      firstInteraction: messages.length > 0 ? new Date(messages[0].timestamp) : new Date(),
      lastInteraction: messages.length > 0 ? new Date(messages[messages.length - 1].timestamp) : new Date(),
      conversationSummary: `${messages.length} mensajes intercambiados`,
      userPersonality: {
        communicationStyle: 'friendly',
        preferredTopics: [],
        emotionalPatterns: [],
        motivationTriggers: [],
      },
      currentSession: {
        sessionId: 'temp-session',
        startedAt: new Date(),
        context: 'continuing_conversation',
        mood: 'neutral',
      },
    };
  }

  async updateUserConversationContext(context: UserConversationContext): Promise<void> {
    await this.prisma.user.update({
      where: { id: context.userId },
      data: { chapiContext: context as any },
    });
  }

  async searchConversations(params: {
    userId: string;
    query?: string;
    emotion?: string;
    dateRange?: { from: Date; to: Date };
    messageType?: string;
  }): Promise<ConversationMessage[]> {
    const { userId, query, emotion, dateRange, messageType } = params;

    const messages = await this.getConversationHistory(userId);

    return messages.filter(msg => {
      if (query && !msg.content.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }

      if (emotion && msg.metadata?.emotion !== emotion) {
        return false;
      }

      if (messageType && msg.messageType !== messageType) {
        return false;
      }

      if (dateRange) {
        const msgDate = msg.timestamp;
        if (msgDate < dateRange.from || msgDate > dateRange.to) {
          return false;
        }
      }

      return true;
    });
  }

  async getConversationStats(userId: string): Promise<{
    totalMessages: number;
    averageMessagesPerDay: number;
    mostCommonEmotions: { emotion: string; count: number }[];
    mostDiscussedTopics: { topic: string; count: number }[];
    conversationTrends: any[];
  }> {
    const messages = await this.getConversationHistory(userId);

    const totalMessages = messages.length;

    // Calcular promedio por día
    let averageMessagesPerDay = 0;
    if (messages.length > 0) {
      const firstMessage = messages[0];
      const daysSinceFirst = Math.max(1, Math.floor((Date.now() - firstMessage.timestamp.getTime()) / (1000 * 60 * 60 * 24)));
      averageMessagesPerDay = totalMessages / daysSinceFirst;
    }

    // Emociones más comunes
    const emotionCounts: Record<string, number> = {};
    messages.forEach(msg => {
      const emotion = msg.metadata?.emotion;
      if (emotion) {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      }
    });

    const mostCommonEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Temas más discutidos (análisis simple)
    const topicKeywords = [
      'peso', 'ejercicio', 'comida', 'sueño', 'agua', 'hidratación',
      'estrés', 'ansiedad', 'motivación', 'objetivo', 'plan', 'entrenamiento'
    ];

    const topicCounts: Record<string, number> = {};
    messages.filter(msg => msg.role === 'user').forEach(msg => {
      const content = msg.content.toLowerCase();
      topicKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          topicCounts[keyword] = (topicCounts[keyword] || 0) + 1;
        }
      });
    });

    const mostDiscussedTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalMessages,
      averageMessagesPerDay: Math.round(averageMessagesPerDay * 100) / 100,
      mostCommonEmotions,
      mostDiscussedTopics,
      conversationTrends: [],
    };
  }

  async generateConversationSummary(userId: string, timeframe: 'week' | 'month' | 'all' = 'all'): Promise<string> {
    const messages = await this.getConversationHistory(userId);

    if (messages.length === 0) {
      return 'Sin conversaciones registradas.';
    }

    // Filtrar por timeframe si es necesario
    let filteredMessages = messages;
    if (timeframe !== 'all') {
      const daysBack = timeframe === 'week' ? 7 : 30;
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
      filteredMessages = messages.filter(msg => msg.timestamp >= cutoffDate);
    }

    if (filteredMessages.length === 0) {
      return `Sin conversaciones en ${timeframe === 'week' ? 'la última semana' : 'el último mes'}.`;
    }

    const userMessages = filteredMessages.filter(m => m.role === 'user');
    const topics = new Set<string>();
    
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      if (content.includes('peso')) topics.add('peso');
      if (content.includes('ejercicio') || content.includes('entrenamiento')) topics.add('ejercicio');
      if (content.includes('comida') || content.includes('alimentación')) topics.add('alimentación');
      if (content.includes('sueño')) topics.add('sueño');
      if (content.includes('estrés') || content.includes('ansiedad')) topics.add('bienestar emocional');
    });

    const timeframeText = timeframe === 'week' ? 'última semana' : timeframe === 'month' ? 'último mes' : 'historial completo';
    const topicsText = Array.from(topics).join(', ') || 'conversación general';
    
    return `En ${timeframeText}: ${filteredMessages.length} mensajes intercambiados. Temas principales: ${topicsText}. El usuario ha mostrado interés en mejorar su bienestar general.`;
  }
}