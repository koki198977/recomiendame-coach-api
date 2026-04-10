import { Body, Controller, Post, Get, Request, UseGuards, Query, Param, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatWithChapiV2UseCase } from '../../core/application/chapi-v2/use-cases/chat-with-chapi-v2.usecase';
import { GetConversationHistoryUseCase } from '../../core/application/chapi-v2/use-cases/get-conversation-history.usecase';
import { GetProactiveInsightsUseCase } from '../../core/application/chapi-v2/use-cases/get-proactive-insights.usecase';
import { UsageLimitService } from '../../core/application/plan/usage-limit.service';
import { FEATURE_GATES } from '../../core/application/plan/feature-gates';

@Controller('chapi-v2')
@UseGuards(JwtAuthGuard)
export class ChapiV2Controller {
  constructor(
    private readonly chatWithChapi: ChatWithChapiV2UseCase,
    private readonly getConversationHistory: GetConversationHistoryUseCase,
    private readonly getProactiveInsights: GetProactiveInsightsUseCase,
    private readonly usageLimitService: UsageLimitService,
  ) {}

  /**
   * Endpoint principal para chatear con Chapi 2.0
   * POST /chapi-v2/chat
   */
  @Post('chat')
  async chat(
    @Body() body: { message: string; sessionId?: string },
    @Request() req: any
  ) {
    const userId = req.user.userId ?? req.user.sub;

    if (req.user?.plan !== 'PRO') {
      const gate = FEATURE_GATES['chapi_basic'];
      const check = await this.usageLimitService.checkAndIncrement(
        userId, 'chapi_basic', gate.limit!, gate.window!,
      );
      if (!check.allowed) {
        throw new ForbiddenException({
          message: `Límite de mensajes alcanzado (${check.limit}/día). Resetea a las ${check.resetsAt.toISOString()}`,
          feature: 'chapi_basic',
          current: check.current,
          limit: check.limit,
          resetsAt: check.resetsAt,
        });
      }
    }

    const result = await this.chatWithChapi.execute({
      userId,
      message: body.message,
      sessionId: body.sessionId,
    });

    if (result.ok) {
      return {
        success: true,
        data: result.value,
      };
    } else {
      return {
        success: false,
        error: result.error.message,
      };
    }
  }

  /**
   * Obtener historial de conversaciones
   * GET /chapi-v2/conversations
   */
  @Get('conversations')
  async getConversations(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('search') searchQuery?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const userId = req.user.userId ?? req.user.sub;
    
    const dateRange = from && to ? {
      from: new Date(from),
      to: new Date(to),
    } : undefined;

    const result = await this.getConversationHistory.execute({
      userId,
      limit: limit ? parseInt(limit) : undefined,
      searchQuery,
      dateRange,
    });

    if (result.ok) {
      return {
        success: true,
        data: result.value,
      };
    } else {
      return {
        success: false,
        error: result.error.message,
      };
    }
  }

  /**
   * Obtener insights proactivos personalizados
   * GET /chapi-v2/insights
   */
  @Get('insights')
  async getInsights(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;

    if (req.user?.plan !== 'PRO') {
      const gate = FEATURE_GATES['chapi_insights'];
      const check = await this.usageLimitService.checkAndIncrement(
        userId, 'chapi_insights', gate.limit!, gate.window!,
      );
      if (!check.allowed) {
        throw new ForbiddenException({
          message: `Límite de insights alcanzado (${check.limit}/día). Resetea a las ${check.resetsAt.toISOString()}`,
          feature: 'chapi_insights',
          current: check.current,
          limit: check.limit,
          resetsAt: check.resetsAt,
        });
      }
    }

    const result = await this.getProactiveInsights.execute({ userId });

    if (result.ok) {
      return {
        success: true,
        data: result.value,
      };
    } else {
      return {
        success: false,
        error: result.error.message,
      };
    }
  }

  /**
   * Endpoint para obtener el contexto completo del usuario
   * GET /chapi-v2/context
   */
  @Get('context')
  async getUserContext(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    
    // Este endpoint podría ser útil para debugging o para mostrar
    // al usuario qué información tiene Chapi sobre él
    try {
      // Aquí podrías implementar un caso de uso específico para obtener
      // el contexto completo del usuario de forma segura
      return {
        success: true,
        message: 'Contexto disponible a través de los otros endpoints',
        availableEndpoints: {
          chat: 'POST /chapi-v2/chat - Conversar con Chapi',
          conversations: 'GET /chapi-v2/conversations - Historial de conversaciones',
          insights: 'GET /chapi-v2/insights - Insights proactivos personalizados',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al obtener contexto del usuario',
      };
    }
  }

  /**
   * Endpoint para obtener estadísticas de conversación
   * GET /chapi-v2/stats
   */
  @Get('stats')
  async getConversationStats(@Request() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    
    const result = await this.getConversationHistory.execute({
      userId,
      limit: 1, // Solo necesitamos las estadísticas
    });

    if (result.ok) {
      return {
        success: true,
        data: {
          conversationStats: result.value.conversationStats,
          conversationSummary: result.value.conversationSummary,
        },
      };
    } else {
      return {
        success: false,
        error: result.error.message,
      };
    }
  }
}