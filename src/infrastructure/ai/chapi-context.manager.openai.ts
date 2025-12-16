import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { ChapiContextManagerPort } from '../../core/application/chapi/ports/out.chapi-context.port';
import { MessageClassification, ConversationContext, ChapiContextualResponse } from '../../core/domain/chapi/entities';
import { ChapiAgentPort } from '../../core/application/chapi/ports/out.chapi-agent.port';
import { PrismaService } from '../database/prisma.service';

const MessageClassificationSchema = z.object({
  type: z.enum(['GREETING', 'EMOTIONAL_EXPRESSION', 'FOLLOW_UP', 'CASUAL', 'MOTIVATION_REQUEST']),
  confidence: z.number().min(0).max(1),
  emotionalIntensity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  requiresAnalysis: z.boolean(),
});

@Injectable()
export class OpenAIChapiContextManager implements ChapiContextManagerPort {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 30000),
  });

  private model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  constructor(
    private readonly chapiAgent: ChapiAgentPort,
    private readonly prisma: PrismaService,
  ) {}

  async classifyMessage(params: {
    message: string;
    userId: string;
    context?: ConversationContext;
  }): Promise<MessageClassification> {
    const system = `Eres un clasificador de mensajes para Chapi, un asistente emocional.

    Tu trabajo es clasificar el tipo de mensaje del usuario para dar la respuesta más apropiada.

    TIPOS DE MENSAJE:
    - GREETING: Saludos simples (hola, buenos días, qué tal, etc.)
    - EMOTIONAL_EXPRESSION: Expresión de emociones o estados (estoy triste, me siento motivado, tengo ansiedad)
    - FOLLOW_UP: Seguimiento de acciones previas (ya hice el ejercicio, cómo me fue con la respiración)
    - CASUAL: Conversación casual sin carga emocional fuerte (qué tal el día, cómo estás)
    - MOTIVATION_REQUEST: Solicitud directa de motivación o consejos (necesito motivación, ayúdame)

    INTENSIDAD EMOCIONAL:
    - LOW: Mensaje neutro o con poca carga emocional
    - MEDIUM: Alguna expresión emocional pero controlada
    - HIGH: Fuerte carga emocional, crisis, euforia, etc.

    CONTEXTO PREVIO: ${params.context ? `
    - Última interacción: ${params.context.lastInteractionType}
    - Estado emocional previo: ${params.context.lastEmotion || 'N/A'}
    - Historial reciente: ${params.context.conversationHistory.slice(-3).map(h => h.message).join(', ')}
    ` : 'Primera interacción'}

    Responde SOLO con JSON válido:
    {
      "type": "GREETING" | "EMOTIONAL_EXPRESSION" | "FOLLOW_UP" | "CASUAL" | "MOTIVATION_REQUEST",
      "confidence": 0.0-1.0,
      "emotionalIntensity": "LOW" | "MEDIUM" | "HIGH",
      "requiresAnalysis": boolean
    }`;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Mensaje: "${params.message}"` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = MessageClassificationSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      // Fallback classification
      return {
        type: 'CASUAL',
        confidence: 0.5,
        emotionalIntensity: 'LOW',
        requiresAnalysis: false,
      };
    }

    return parsed.data;
  }

  async generateContextualResponse(params: {
    message: string;
    userId: string;
    classification: MessageClassification;
    context: ConversationContext;
    userProfile: any;
  }): Promise<ChapiContextualResponse> {
    const { message, classification, context, userProfile } = params;

    switch (classification.type) {
      case 'GREETING':
        return this.generateGreetingResponse(message, context, userProfile);
      
      case 'EMOTIONAL_EXPRESSION':
        return this.generateEmotionalResponse(message, context, userProfile);
      
      case 'FOLLOW_UP':
        return this.generateFollowUpResponse(message, context, userProfile);
      
      case 'CASUAL':
        return this.generateCasualResponse(message, context, userProfile);
      
      case 'MOTIVATION_REQUEST':
        return this.generateMotivationResponse(message, context, userProfile);
      
      default:
        return this.generateCasualResponse(message, context, userProfile);
    }
  }

  private async generateGreetingResponse(
    message: string,
    context: ConversationContext,
    userProfile: any
  ): Promise<ChapiContextualResponse> {
    const greetings = [
      `¡Hola! 😊 Me alegra verte por aquí. ¿Cómo te sientes hoy?`,
      `¡Hey! 👋 ¿Qué tal tu día? Cuéntame cómo andas.`,
      `¡Hola! ✨ Aquí estoy para acompañarte. ¿Cómo está tu energía hoy?`,
      `¡Buenas! 🌟 ¿Cómo te encuentras? Estoy aquí para lo que necesites.`,
    ];

    const timeBasedGreetings = this.getTimeBasedGreeting();
    const selectedGreeting = Math.random() > 0.5 ? 
      greetings[Math.floor(Math.random() * greetings.length)] : 
      timeBasedGreetings;

    return {
      type: 'GREETING',
      message: selectedGreeting,
      suggestions: [
        'Cuéntame cómo te sientes',
        'Necesito motivación',
        'Quiero hacer ejercicio',
        'Me siento un poco ansioso/a'
      ],
      followUpQuestions: [
        '¿Cómo dormiste anoche?',
        '¿Qué planes tienes para hoy?',
        '¿Hay algo específico en lo que te pueda ayudar?'
      ]
    };
  }

  private async generateEmotionalResponse(
    message: string,
    context: ConversationContext,
    userProfile: any
  ): Promise<ChapiContextualResponse> {
    // Aquí sí usamos el análisis completo
    const analysis = await this.chapiAgent.analyzeMood({
      userId: context.userId,
      message,
      userProfile,
    });

    return {
      type: 'EMOTIONAL_ANALYSIS',
      message: `**Estado emocional detectado: ${analysis.emotion}**\n\n${analysis.neuroscience}`,
      emotionalAnalysis: analysis,
      suggestions: analysis.actions.map(action => action.title),
    };
  }

  private async generateFollowUpResponse(
    message: string,
    context: ConversationContext,
    userProfile: any
  ): Promise<ChapiContextualResponse> {
    const followUpResponses = [
      `¡Genial que me cuentes cómo te fue! 🎉 ¿Cómo te sientes después de hacerlo?`,
      `Me encanta que hayas seguido las sugerencias 💪 ¿Notaste algún cambio en tu estado?`,
      `¡Excelente! 🌟 ¿Te ayudó? Cuéntame qué tal la experiencia.`,
    ];

    return {
      type: 'FOLLOW_UP',
      message: followUpResponses[Math.floor(Math.random() * followUpResponses.length)],
      followUpQuestions: [
        '¿Te sientes mejor ahora?',
        '¿Qué más te gustaría probar?',
        '¿Necesitas algo más específico?'
      ]
    };
  }

  private async generateCasualResponse(
    message: string,
    context: ConversationContext,
    userProfile: any
  ): Promise<ChapiContextualResponse> {
    const casualResponses = [
      `Todo bien por aquí 😊 ¿Y tú qué tal? ¿Cómo va tu día?`,
      `¡Aquí andamos! 🌟 ¿Hay algo en lo que te pueda acompañar hoy?`,
      `Por aquí, listo para ayudarte 💪 ¿Cómo te sientes?`,
    ];

    return {
      type: 'CASUAL_CHAT',
      message: casualResponses[Math.floor(Math.random() * casualResponses.length)],
      suggestions: [
        'Cuéntame cómo te sientes',
        'Necesito un poco de motivación',
        'Quiero hacer algo de ejercicio'
      ]
    };
  }

  private async generateMotivationResponse(
    message: string,
    context: ConversationContext,
    userProfile: any
  ): Promise<ChapiContextualResponse> {
    // Para motivación, sí hacemos análisis pero con enfoque motivacional
    const analysis = await this.chapiAgent.analyzeMood({
      userId: context.userId,
      message: `Necesito motivación: ${message}`,
      userProfile,
    });

    const motivationalIntros = [
      `¡Vamos que sí puedes! 💪`,
      `¡Aquí estoy para darte ese empujón! 🚀`,
      `¡Tu energía está ahí, solo hay que despertarla! ⚡`,
    ];

    const intro = motivationalIntros[Math.floor(Math.random() * motivationalIntros.length)];

    return {
      type: 'MOTIVATION',
      message: `${intro}\n\n${analysis.neuroscience}`,
      emotionalAnalysis: analysis,
      suggestions: analysis.actions.map(action => action.title),
    };
  }

  private getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return `¡Buenos días! ☀️ ¿Cómo amaneciste hoy?`;
    } else if (hour < 18) {
      return `¡Buenas tardes! 🌤️ ¿Qué tal va tu día?`;
    } else {
      return `¡Buenas noches! 🌙 ¿Cómo te sientes esta noche?`;
    }
  }

  async updateContext(params: {
    userId: string;
    message: string;
    classification: MessageClassification;
    response: ChapiContextualResponse;
  }): Promise<ConversationContext> {
    const existing = await this.getContext(params.userId);
    
    const newContext: ConversationContext = {
      userId: params.userId,
      lastInteractionType: params.classification.type,
      lastEmotion: params.response.emotionalAnalysis?.emotion,
      conversationHistory: [
        ...(existing?.conversationHistory || []).slice(-10), // Keep last 10
        {
          message: params.message,
          timestamp: new Date(),
          type: params.classification.type,
        }
      ],
      currentMood: params.response.emotionalAnalysis?.emotion || existing?.currentMood,
      sessionStarted: existing?.sessionStarted || new Date(),
    };

    // Save to database (simple JSON storage)
    await this.prisma.user.update({
      where: { id: params.userId },
      data: {
        chapiContext: newContext as any,
      },
    });

    return newContext;
  }

  async getContext(userId: string): Promise<ConversationContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { chapiContext: true },
    });

    if (!user?.chapiContext) return null;
    
    try {
      return user.chapiContext as unknown as ConversationContext;
    } catch {
      return null;
    }
  }
}