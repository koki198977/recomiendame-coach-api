import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ChapiLegacyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isLegacyClient = this.isLegacyClient(request);

    return next.handle().pipe(
      map(data => {
        // Si es un cliente legacy y estamos en el endpoint check-in, convertir formato
        if (isLegacyClient && request.url.includes('/chapi/check-in') && !request.url.includes('/legacy')) {
          return this.convertToLegacyFormat(data);
        }
        return data;
      }),
    );
  }

  private isLegacyClient(request: any): boolean {
    const userAgent = request.headers['user-agent'] || '';
    const appVersion = request.headers['app-version'] || '';
    const clientVersion = request.headers['client-version'] || '';

    // Detectar apps legacy por User-Agent, versión, etc.
    const legacyIndicators = [
      // Versiones específicas de tu app que usan formato legacy
      appVersion.startsWith('1.0'),
      appVersion.startsWith('1.1'),
      appVersion.startsWith('1.2'),
      // O por User-Agent específico
      userAgent.includes('RecomiendameApp/1.'),
      // O si no tiene header de nueva versión
      !clientVersion || clientVersion < '2.0.0',
    ];

    return legacyIndicators.some(indicator => indicator);
  }

  private convertToLegacyFormat(data: any): any {
    // Si ya está en formato legacy, devolverlo tal como está
    if (data.logId !== undefined && data.emotion !== undefined && data.advice !== undefined) {
      return data;
    }

    // Convertir formato nuevo a legacy
    if (data.emotionalAnalysis) {
      return {
        logId: data.emotionalAnalysis.logId || '',
        emotion: data.emotionalAnalysis.emotion,
        advice: data.emotionalAnalysis.advice,
        actions: data.emotionalAnalysis.actions.map((action: any) => ({
          title: action.title || action.name || 'Acción recomendada',
          type: action.type || 'PHYSICAL',
          durationMinutes: action.durationMinutes || action.duration || 15,
        })),
      };
    }

    // Si no hay análisis emocional, crear respuesta básica compatible
    return {
      logId: '',
      emotion: 'NEUTRAL',
      advice: data.message || 'Gracias por compartir tu estado emocional.',
      actions: [
        {
          title: 'Continuar conversación',
          type: 'MENTAL',
          durationMinutes: 5,
        },
      ],
    };
  }
}