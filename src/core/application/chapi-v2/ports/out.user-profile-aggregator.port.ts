import { UserCompleteProfile } from './out.chapi-v2-agent.port';

export const USER_PROFILE_AGGREGATOR = 'USER_PROFILE_AGGREGATOR';

export interface UserProfileAggregatorPort {
  /**
   * Obtiene el perfil completo del usuario con todos sus datos
   * incluyendo patrones identificados y análisis predictivo
   */
  getCompleteUserProfile(userId: string): Promise<UserCompleteProfile>;

  /**
   * Analiza patrones del usuario basado en su historial
   */
  analyzeUserPatterns(userId: string): Promise<{
    sleepPattern: {
      averageHours: number;
      averageQuality: number;
      consistency: 'high' | 'medium' | 'low';
      trends: string[];
    };
    activityPattern: {
      averageSteps: number;
      averageActiveMinutes: number;
      preferredActivities: string[];
      consistency: 'high' | 'medium' | 'low';
    };
    nutritionPattern: {
      averageAdherence: number;
      preferredMeals: string[];
      macroBalance: { protein: number; carbs: number; fats: number };
      eatingTimes: string[];
    };
    emotionalPattern: {
      dominantEmotions: string[];
      emotionalTriggers: string[];
      copingStrategies: string[];
      emotionalTrends: string[];
    };
    adherencePattern: {
      overallAdherence: number;
      strongestAreas: string[];
      challengingAreas: string[];
      motivationFactors: string[];
    };
  }>;

  /**
   * Genera predicciones basadas en el comportamiento del usuario
   */
  generatePredictiveInsights(userId: string): Promise<{
    riskFactors: {
      abandonmentRisk: 'low' | 'medium' | 'high';
      burnoutRisk: 'low' | 'medium' | 'high';
      plateauRisk: 'low' | 'medium' | 'high';
    };
    opportunities: {
      improvementAreas: string[];
      motivationOpportunities: string[];
      habitFormationOpportunities: string[];
    };
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  }>;

  /**
   * Obtiene el contexto actual del usuario (estado del día)
   */
  getCurrentUserContext(userId: string): Promise<{
    todayProgress: {
      checkinCompleted: boolean;
      hydrationProgress: number;
      mealsLogged: number;
      workoutCompleted: boolean;
      sleepLogged: boolean;
    };
    recentTrends: {
      weightTrend: 'increasing' | 'decreasing' | 'stable';
      adherenceTrend: 'improving' | 'declining' | 'stable';
      emotionalTrend: 'positive' | 'negative' | 'neutral';
    };
    upcomingEvents: {
      goalDeadlines: any[];
      planExpirations: any[];
      streakMilestones: any[];
    };
  }>;
}