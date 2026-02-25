import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChapiV2AgentPort, UserCompleteProfile } from '../../core/application/chapi-v2/ports/out.chapi-v2-agent.port';
import { ChapiV2Response, UserConversationContext } from '../../core/domain/chapi-v2/entities/conversation.entity';

@Injectable()
export class OpenAIChapiV2Agent implements ChapiV2AgentPort {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    timeout: +(process.env.OPENAI_TIMEOUT_MS ?? 45000),
  });

  private model = process.env.OPENAI_MODEL ?? 'gpt-4o';

  async generatePersonalizedResponse(params: {
    userMessage: string;
    userProfile: UserCompleteProfile;
    conversationContext: UserConversationContext;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    intent?: string;
  }): Promise<ChapiV2Response> {
    const { userMessage, userProfile, conversationContext, conversationHistory = [] } = params;

    const systemPrompt = this.buildSystemPrompt(userProfile, conversationContext);
    const contextPrompt = this.buildContextPrompt(userProfile, conversationContext);

    // Construir el array de mensajes incluyendo el historial reciente
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextPrompt },
    ];

    // Agregar los últimos mensajes de la conversación (máximo 10 para no exceder tokens)
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory);

    // Agregar el mensaje actual del usuario
    messages.push({ role: 'user', content: userMessage });

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.7,
        max_tokens: 1500,
        messages,
        functions: [
          {
            name: 'generate_personalized_response',
            description: 'Genera una respuesta personalizada para el usuario',
            parameters: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Respuesta conversacional natural y personalizada'
                },
                messageType: {
                  type: 'string',
                  enum: ['conversational', 'analytical', 'motivational', 'educational'],
                  description: 'Tipo de mensaje'
                },
                personalizedInsights: {
                  type: 'object',
                  properties: {
                    basedOnHistory: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Insights basados en el historial del usuario'
                    },
                    predictiveAnalysis: {
                      type: 'string',
                      description: 'Análisis predictivo personalizado'
                    },
                    recommendations: {
                      type: 'array',
                      items: { type: 'object' },
                      description: 'Recomendaciones específicas'
                    }
                  }
                },
                actions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['create_plan', 'update_goal', 'schedule_reminder', 'track_metric']
                      },
                      data: { type: 'object' }
                    }
                  }
                },
                followUpSuggestions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Sugerencias de seguimiento'
                }
              },
              required: ['message', 'messageType']
            }
          }
        ],
        function_call: { name: 'generate_personalized_response' }
      });

      const functionCall = completion.choices[0]?.message?.function_call;
      if (functionCall?.arguments) {
        const response = JSON.parse(functionCall.arguments);
        return {
          message: response.message,
          messageType: response.messageType || 'conversational',
          personalizedInsights: response.personalizedInsights,
          actions: response.actions || [],
          followUpSuggestions: response.followUpSuggestions || [],
        };
      }

      // Fallback response
      return {
        message: 'Entiendo tu mensaje. ¿En qué más puedo ayudarte hoy?',
        messageType: 'conversational',
        followUpSuggestions: ['¿Cómo te sientes hoy?', '¿Quieres revisar tu progreso?'],
      };

    } catch (error) {
      console.error('Error generating personalized response:', error);
      return {
        message: 'Disculpa, tuve un problema procesando tu mensaje. ¿Podrías intentar de nuevo?',
        messageType: 'conversational',
      };
    }
  }

  async generateProactiveInsights(params: {
    userProfile: UserCompleteProfile;
    conversationContext: UserConversationContext;
  }): Promise<{
    insights: string[];
    recommendations: any[];
    predictiveAlerts: string[];
  }> {
    const { userProfile, conversationContext } = params;

    const systemPrompt = `Eres Chapi, un asistente de salud y bienestar altamente inteligente y personalizado.

Tu trabajo es generar insights proactivos basados en el perfil completo del usuario y su historial conversacional.

PERFIL DEL USUARIO:
${JSON.stringify(userProfile, null, 2)}

CONTEXTO CONVERSACIONAL:
${JSON.stringify(conversationContext, null, 2)}

Genera insights proactivos que sean:
1. Específicos para este usuario
2. Basados en sus datos reales
3. Accionables y útiles
4. Predictivos cuando sea posible

Responde en JSON con:
{
  "insights": ["insight1", "insight2", ...],
  "recommendations": [{"type": "...", "title": "...", "description": "...", "priority": "high|medium|low"}],
  "predictiveAlerts": ["alert1", "alert2", ...]
}`;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.6,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Genera insights proactivos para este usuario.' },
        ],
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        insights: response.insights || [],
        recommendations: response.recommendations || [],
        predictiveAlerts: response.predictiveAlerts || [],
      };

    } catch (error) {
      console.error('Error generating proactive insights:', error);
      return {
        insights: [],
        recommendations: [],
        predictiveAlerts: [],
      };
    }
  }

  async updateConversationContext(params: {
    userId: string;
    userMessage: string;
    assistantResponse: ChapiV2Response;
    currentContext: UserConversationContext;
  }): Promise<UserConversationContext> {
    const { currentContext, userMessage, assistantResponse } = params;

    // Actualizar estadísticas básicas
    const updatedContext: UserConversationContext = {
      ...currentContext,
      totalMessages: currentContext.totalMessages + 2, // user + assistant
      lastInteraction: new Date(),
    };

    // Actualizar resumen de conversación (simplificado)
    if (currentContext.totalMessages === 0) {
      updatedContext.conversationSummary = `Primera conversación: ${userMessage.substring(0, 100)}...`;
    } else {
      // En una implementación real, aquí usarías IA para generar un resumen inteligente
      updatedContext.conversationSummary = `${currentContext.conversationSummary} | Última: ${userMessage.substring(0, 50)}...`;
    }

    // Detectar patrones de personalidad (simplificado)
    if (userMessage.toLowerCase().includes('gracias') || userMessage.toLowerCase().includes('por favor')) {
      if (!updatedContext.userPersonality.emotionalPatterns.includes('cortés')) {
        updatedContext.userPersonality.emotionalPatterns.push('cortés');
      }
    }

    return updatedContext;
  }

  private buildSystemPrompt(userProfile: UserCompleteProfile, conversationContext: UserConversationContext): string {
    return `Eres Chapi 2.0, un asistente de salud y bienestar altamente inteligente, empático y personalizado.

PERSONALIDAD:
- Conversacional y natural, nunca robotizado
- Empático y comprensivo
- Motivador pero realista
- Recuerdas todo sobre el usuario
- Te adaptas al estilo de comunicación del usuario

CAPACIDADES:
- Acceso completo al perfil y datos del usuario
- Memoria de todas las conversaciones anteriores
- Análisis predictivo basado en patrones
- Recomendaciones personalizadas
- Seguimiento de progreso integral

ESTILO DE COMUNICACIÓN:
- ${conversationContext.userPersonality.communicationStyle}
- Usa un tono ${conversationContext.userPersonality.communicationStyle === 'formal' ? 'profesional' : 'amigable y cercano'}
- Personaliza cada respuesta basándote en el historial del usuario

INSTRUCCIONES:
1. SIEMPRE personaliza tu respuesta basándote en el perfil completo del usuario
2. Haz referencia a conversaciones anteriores cuando sea relevante
3. Usa los datos específicos del usuario (peso, objetivos, patrones, etc.)
4. Proporciona insights basados en sus datos reales
5. Sé proactivo sugiriendo acciones específicas
6. Mantén un tono conversacional y natural
7. Recuerda sus preferencias, alergias, condiciones, etc.

NUNCA:
- Seas genérico o robotizado
- Ignores el contexto del usuario
- Des consejos que contradigan sus condiciones médicas
- Olvides información importante del usuario`;
  }

  private buildContextPrompt(userProfile: UserCompleteProfile, conversationContext: UserConversationContext): string {
    const recentData = this.summarizeRecentData(userProfile);
    
    return `CONTEXTO ACTUAL DEL USUARIO:

PERFIL BÁSICO:
- ${userProfile.profile.sex}, ${userProfile.profile.age} años
- Peso actual: ${userProfile.profile.weightKg}kg, Objetivo: ${userProfile.profile.targetWeightKg}kg
- Objetivo: ${userProfile.profile.nutritionGoal}
- Nivel de actividad: ${userProfile.profile.activityLevel}
- Motivación actual: ${userProfile.profile.currentMotivation}

CONDICIONES IMPORTANTES:
- Alergias: ${userProfile.allergies.join(', ') || 'Ninguna'}
- Condiciones médicas: ${userProfile.conditions.join(', ') || 'Ninguna'}

HISTORIAL CONVERSACIONAL:
- Total de mensajes: ${conversationContext.totalMessages}
- Primera interacción: ${new Date(conversationContext.firstInteraction).toLocaleDateString()}
- Última interacción: ${new Date(conversationContext.lastInteraction).toLocaleDateString()}
- Resumen: ${conversationContext.conversationSummary}
- Patrones emocionales: ${conversationContext.userPersonality.emotionalPatterns.join(', ')}

DATOS RECIENTES (últimos 7 días):
${recentData}

PATRONES IDENTIFICADOS:
- Sueño: ${userProfile.patterns.sleepPattern}
- Actividad: ${userProfile.patterns.activityPattern}
- Nutrición: ${userProfile.patterns.nutritionPattern}
- Emocional: ${userProfile.patterns.emotionalPattern}
- Adherencia: ${userProfile.patterns.adherencePattern}

ESTADO ACTUAL:
- Puntos: ${userProfile.points}
- Racha actual: ${userProfile.currentStreak ? 'Activa' : 'Inactiva'}
- Logros recientes: ${userProfile.achievements.length} logros desbloqueados`;
  }

  private summarizeRecentData(userProfile: UserCompleteProfile): string {
    const summaries: string[] = [];

    if (userProfile.recentCheckins.length > 0) {
      const avgWeight = userProfile.recentCheckins.reduce((sum, c) => sum + (c.weightKg || 0), 0) / userProfile.recentCheckins.length;
      summaries.push(`- Peso promedio: ${avgWeight.toFixed(1)}kg`);
    }

    if (userProfile.recentHydration.length > 0) {
      const avgHydration = userProfile.recentHydration.reduce((sum, h) => sum + h.amountMl, 0) / userProfile.recentHydration.length;
      summaries.push(`- Hidratación promedio: ${avgHydration.toFixed(0)}ml/día`);
    }

    if (userProfile.recentSleep.length > 0) {
      const avgSleep = userProfile.recentSleep.reduce((sum, s) => sum + Number(s.hours), 0) / userProfile.recentSleep.length;
      summaries.push(`- Sueño promedio: ${avgSleep.toFixed(1)} horas/noche`);
    }

    if (userProfile.recentEmotions.length > 0) {
      const emotions = userProfile.recentEmotions.map(e => e.emotion).slice(0, 3);
      summaries.push(`- Emociones recientes: ${emotions.join(', ')}`);
    }

    return summaries.join('\n') || '- Sin datos recientes disponibles';
  }
}