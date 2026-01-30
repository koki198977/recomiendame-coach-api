import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from '../../../domain/common/result';
import { CHAPI_V2_AGENT, ChapiV2AgentPort } from '../ports/out.chapi-v2-agent.port';
import { CONVERSATION_MEMORY, ConversationMemoryPort } from '../ports/out.conversation-memory.port';
import { USER_PROFILE_AGGREGATOR, UserProfileAggregatorPort } from '../ports/out.user-profile-aggregator.port';

export interface GetProactiveInsightsInput {
  userId: string;
}

export interface GetProactiveInsightsOutput {
  insights: string[];
  recommendations: any[];
  predictiveAlerts: string[];
  userContext: {
    todayProgress: any;
    recentTrends: any;
    upcomingEvents: any;
  };
  conversationOpportunities: {
    suggestedTopics: string[];
    followUpQuestions: string[];
    motivationalMessages: string[];
  };
}

@Injectable()
export class GetProactiveInsightsUseCase {
  constructor(
    @Inject(CHAPI_V2_AGENT) private readonly chapiAgent: ChapiV2AgentPort,
    @Inject(CONVERSATION_MEMORY) private readonly conversationMemory: ConversationMemoryPort,
    @Inject(USER_PROFILE_AGGREGATOR) private readonly profileAggregator: UserProfileAggregatorPort,
  ) {}

  async execute(input: GetProactiveInsightsInput): Promise<Result<GetProactiveInsightsOutput>> {
    try {
      const { userId } = input;

      // 1. Obtener el perfil completo del usuario
      const userProfile = await this.profileAggregator.getCompleteUserProfile(userId);

      // 2. Obtener el contexto conversacional
      const conversationContext = await this.conversationMemory.getUserConversationContext(userId);

      // 3. Obtener el contexto actual del usuario
      const userContext = await this.profileAggregator.getCurrentUserContext(userId);

      // 4. Generar insights proactivos con IA
      const proactiveInsights = await this.chapiAgent.generateProactiveInsights({
        userProfile,
        conversationContext: conversationContext || {
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
            sessionId: 'proactive',
            startedAt: new Date(),
            context: 'proactive_insights',
            mood: 'neutral',
          },
        },
      });

      // 5. Generar oportunidades conversacionales basadas en el historial
      const recentMessages = await this.conversationMemory.getConversationHistory(userId, 10);
      const conversationStats = await this.conversationMemory.getConversationStats(userId);

      const conversationOpportunities = this.generateConversationOpportunities(
        recentMessages,
        conversationStats,
        userProfile,
        userContext
      );

      return ok({
        insights: proactiveInsights.insights,
        recommendations: proactiveInsights.recommendations,
        predictiveAlerts: proactiveInsights.predictiveAlerts,
        userContext,
        conversationOpportunities,
      });

    } catch (error) {
      console.error('Error in GetProactiveInsightsUseCase:', error);
      return err(new Error('Error al generar insights proactivos'));
    }
  }

  private generateConversationOpportunities(
    recentMessages: any[],
    conversationStats: any,
    userProfile: any,
    userContext: any
  ) {
    const suggestedTopics: string[] = [];
    const followUpQuestions: string[] = [];
    const motivationalMessages: string[] = [];

    // Generar temas sugeridos basados en el progreso actual
    if (!userContext.todayProgress.checkinCompleted) {
      suggestedTopics.push('Registro diario de progreso');
      followUpQuestions.push('¿Cómo te sientes hoy? ¿Quieres hacer tu check-in diario?');
    }

    if (userContext.todayProgress.hydrationProgress < 0.5) {
      suggestedTopics.push('Hidratación');
      followUpQuestions.push('¿Has estado tomando suficiente agua hoy?');
    }

    if (!userContext.todayProgress.workoutCompleted) {
      suggestedTopics.push('Actividad física');
      followUpQuestions.push('¿Tienes planes de hacer ejercicio hoy?');
    }

    // Mensajes motivacionales basados en tendencias
    if (userContext.recentTrends.adherenceTrend === 'improving') {
      motivationalMessages.push('¡He notado que has estado muy consistente últimamente! ¿Cómo te sientes con tu progreso?');
    }

    if (userContext.recentTrends.weightTrend === 'decreasing' && userProfile.profile.nutritionGoal === 'LOSE_WEIGHT') {
      motivationalMessages.push('¡Excelente progreso con tu objetivo de peso! ¿Qué estrategias te han funcionado mejor?');
    }

    // Temas basados en emociones más comunes
    if (conversationStats.mostCommonEmotions.length > 0) {
      const dominantEmotion = conversationStats.mostCommonEmotions[0].emotion;
      if (dominantEmotion === 'STRESS' || dominantEmotion === 'ANXIETY') {
        suggestedTopics.push('Manejo del estrés');
        followUpQuestions.push('¿Te gustaría hablar sobre técnicas de relajación?');
      }
    }

    return {
      suggestedTopics,
      followUpQuestions,
      motivationalMessages,
    };
  }
}