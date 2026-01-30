export interface ConversationMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  messageType: 'text' | 'action' | 'recommendation' | 'analysis' | 'conversational' | 'analytical' | 'motivational' | 'educational';
  metadata?: {
    emotion?: string;
    intent?: string;
    context?: Record<string, any>;
    actions?: any[];
    sessionId?: string;
    personalizedInsights?: any;
    followUpSuggestions?: string[];
  };
}

export interface UserConversationContext {
  userId: string;
  totalMessages: number;
  firstInteraction: Date;
  lastInteraction: Date;
  conversationSummary: string; // Resumen de conversaciones pasadas
  userPersonality: {
    communicationStyle: 'formal' | 'casual' | 'friendly';
    preferredTopics: string[];
    emotionalPatterns: string[];
    motivationTriggers: string[];
  };
  currentSession: {
    sessionId: string;
    startedAt: Date;
    context: string;
    mood: string;
  };
}

export interface ChapiV2Response {
  message: string;
  messageType: 'conversational' | 'analytical' | 'motivational' | 'educational';
  personalizedInsights?: {
    basedOnHistory: string[];
    predictiveAnalysis: string;
    recommendations: any[];
  };
  actions?: {
    type: 'create_plan' | 'update_goal' | 'schedule_reminder' | 'track_metric';
    data: any;
  }[];
  followUpSuggestions?: string[];
  contextualData?: {
    relevantHistory: any[];
    currentMetrics: any;
    progressAnalysis: any;
  };
}