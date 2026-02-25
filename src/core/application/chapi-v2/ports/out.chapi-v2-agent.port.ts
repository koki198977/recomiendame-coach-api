import { ChapiV2Response, UserConversationContext } from '../../../domain/chapi-v2/entities/conversation.entity';

export const CHAPI_V2_AGENT = 'CHAPI_V2_AGENT';

export interface UserCompleteProfile {
  // Datos básicos
  id: string;
  email: string;
  profile: {
    sex: string;
    age: number;
    heightCm: number;
    weightKg: number;
    activityLevel: string;
    country: string;
    nutritionGoal: string;
    targetWeightKg: number;
    timeFrame: string;
    intensity: string;
    currentMotivation: string;
  };
  
  // Salud y condiciones
  allergies: string[];
  conditions: string[];
  cuisinePreferences: { cuisine: string; preference: 'LIKE' | 'DISLIKE' }[];
  
  // Datos de seguimiento recientes (últimos 30 días)
  recentCheckins: any[];
  recentHydration: any[];
  recentSleep: any[];
  recentActivity: any[];
  recentMeals: any[];
  recentEmotions: any[];
  
  // Objetivos y planes actuales
  currentGoals: any[];
  activePlans: any[];
  activeWorkouts: any[];
  
  // Social y gamificación
  achievements: any[];
  currentStreak: any;
  points: number;
  
  // Patrones identificados
  patterns: {
    sleepPattern: string;
    activityPattern: string;
    nutritionPattern: string;
    emotionalPattern: string;
    adherencePattern: string;
  };
}

export interface ChapiV2AgentPort {
  /**
   * Genera una respuesta inteligente y personalizada basada en:
   * - El mensaje del usuario
   * - Todo su perfil completo
   * - El contexto conversacional completo
   * - El historial reciente de mensajes
   * - Análisis predictivo de patrones
   */
  generatePersonalizedResponse(params: {
    userMessage: string;
    userProfile: UserCompleteProfile;
    conversationContext: UserConversationContext;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    intent?: string;
  }): Promise<ChapiV2Response>;

  /**
   * Analiza el perfil completo del usuario para generar insights proactivos
   */
  generateProactiveInsights(params: {
    userProfile: UserCompleteProfile;
    conversationContext: UserConversationContext;
  }): Promise<{
    insights: string[];
    recommendations: any[];
    predictiveAlerts: string[];
  }>;

  /**
   * Actualiza el contexto conversacional basado en la interacción
   */
  updateConversationContext(params: {
    userId: string;
    userMessage: string;
    assistantResponse: ChapiV2Response;
    currentContext: UserConversationContext;
  }): Promise<UserConversationContext>;
}