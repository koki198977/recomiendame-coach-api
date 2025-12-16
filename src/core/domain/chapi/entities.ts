export interface EmotionalLog {
  id: string;
  userId: string;
  message: string;
  emotion: string;
  advice: string;
  actions: ChapiAction[];
  createdAt?: Date;
}

export interface ChapiAction {
  title: string;
  type: 'PHYSICAL' | 'MENTAL' | 'BREATHING' | 'OTHER';
  durationMinutes: number;
}

export interface ChapiResponse {
  emotion: string;
  neuroscience: string;
  actions: ChapiAction[];
  miniTask?: string;
}

// Nuevas interfaces para el sistema contextual
export interface ChapiContextualResponse {
  type: 'GREETING' | 'EMOTIONAL_ANALYSIS' | 'FOLLOW_UP' | 'CASUAL_CHAT' | 'MOTIVATION';
  message: string;
  emotionalAnalysis?: ChapiResponse;
  suggestions?: string[];
  followUpQuestions?: string[];
}

export interface ConversationContext {
  userId: string;
  lastInteractionType: string;
  lastEmotion?: string;
  conversationHistory: Array<{
    message: string;
    timestamp: Date;
    type: string;
  }>;
  currentMood?: string;
  sessionStarted: Date;
}

export interface MessageClassification {
  type: 'GREETING' | 'EMOTIONAL_EXPRESSION' | 'FOLLOW_UP' | 'CASUAL' | 'MOTIVATION_REQUEST';
  confidence: number;
  emotionalIntensity: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresAnalysis: boolean;
}