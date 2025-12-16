import { Controller, Get, Post, Param, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationTriggersService } from './notification-triggers.service';
import { PushNotificationsService } from './push-notifications.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Asumiendo que tienes auth

@Controller('notifications')
// @UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private triggersService: NotificationTriggersService,
    private pushNotificationsService: PushNotificationsService,
  ) {}

  @Get()
  async getNotifications(@Request() req: any) {
    // const userId = req.user.id; // Desde JWT
    const userId = req.query.userId; // Temporal para testing
    return this.notificationsService.getUserNotifications(userId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    // const userId = req.user.id;
    const userId = req.query.userId; // Temporal
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('trigger/:type')
  async triggerNotification(
    @Param('type') type: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    // const userId = req.user.id;
    const userId = req.query.userId || data.userId; // Temporal
    return this.triggersService.triggerNotification(userId, type, data);
  }

  // Endpoint para testing - crear notificación manual
  @Post('test')
  async createTestNotification(@Body() body: any) {
    const { userId, title, message } = body;
    
    await this.notificationsService.createNotification(userId, {
      title,
      body: message,
      actions: [
        { label: 'Ver más', action: 'view_more' },
        { label: 'Cerrar', action: 'dismiss' },
      ],
      type: 'test',
      priority: 'medium',
    });

    return { success: true };
  }

  @Get('analytics/:userId')
  async getUserAnalytics(@Param('userId') userId: string) {
    // Aquí integrarías SmartAnalyticsService
    return {
      userId,
      insights: [
        {
          type: 'sleep_hunger_correlation',
          message: 'Cuando duermes menos de 6h, tu hambre aumenta 2.3 puntos promedio',
          actionable: true,
        },
        {
          type: 'activity_adherence_correlation', 
          message: 'Los días que caminas más de 8000 pasos, tu adherencia mejora 23%',
          actionable: true,
        },
      ],
      abandonmentRisk: 25, // Bajo riesgo
      recommendations: [
        'Priorizar 7-8 horas de sueño para controlar el hambre',
        'Mantener actividad física para mejorar adherencia',
      ],
    };
  }

  @Post('health-check/:userId')
  async triggerHealthCheck(@Param('userId') userId: string) {
    // Aquí integrarías HealthAwareNotificationsService
    // await this.healthAwareService.checkHealthConditionCompliance(userId);
    return { message: 'Health check triggered', userId };
  }

  @Post('demo')
  async createDemoNotifications(@Body() body: { userId: string }) {
    const { userId } = body;
    
    // Crear notificaciones de demostración
    const demoNotifications = [
      {
        title: '💧 ¡Necesitas más agua!',
        body: 'Solo has tomado 800ml hoy. Tu objetivo son 2L.',
        actions: [
          { label: 'Recordatorio cada 2h', action: 'set_hydration_reminder' },
          { label: 'Registrar Agua', action: 'log_water' },
        ],
        type: 'hydration_demo',
        priority: 'medium' as const,
      },
      {
        title: '📊 Tu adherencia ha bajado',
        body: 'Solo has seguido el 65% de tu plan esta semana.',
        actions: [
          { label: 'Simplificar Plan', action: 'simplify_plan' },
          { label: 'Ver Consejos', action: 'view_tips' },
        ],
        type: 'adherence_demo',
        priority: 'medium' as const,
      },
      {
        title: '🎉 ¡Casi logras tu objetivo!',
        body: 'Solo te faltan 1.2kg para llegar a tu meta.',
        actions: [
          { label: 'Ver Progreso', action: 'view_progress' },
          { label: 'Celebrar', action: 'celebrate' },
        ],
        type: 'goal_demo',
        priority: 'high' as const,
      },
    ];

    for (const notif of demoNotifications) {
      await this.notificationsService.createNotification(userId, notif);
    }

    return { 
      message: `${demoNotifications.length} notificaciones demo creadas`,
      userId,
      notifications: demoNotifications.map(n => ({ title: n.title, type: n.type }))
    };
  }

  @Post('register-token')
  async registerDeviceToken(@Body() body: any, @Request() req: any) {
    const { token, platform } = body;
    // const userId = req.user.id;
    const userId = req.query.userId || body.userId; // Temporal

    await this.pushNotificationsService.registerDeviceToken(userId, token, platform);
    
    return { 
      success: true, 
      message: 'Token registrado correctamente',
      userId,
      platform 
    };
  }

  @Delete('unregister-token')
  async unregisterDeviceToken(@Body() body: any) {
    const { token } = body;
    
    await this.pushNotificationsService.unregisterDeviceToken(token);
    
    return { 
      success: true, 
      message: 'Token eliminado correctamente' 
    };
  }

  @Post('test-push/:userId')
  async testPushNotification(@Param('userId') userId: string) {
    await this.pushNotificationsService.sendToUser(userId, {
      title: '🧪 Notificación de Prueba',
      body: 'Si recibes esto, las push notifications funcionan correctamente!',
      data: { test: true, timestamp: new Date().toISOString() },
      sound: 'default',
    });

    return { 
      success: true, 
      message: 'Push notification de prueba enviada',
      userId 
    };
  }
}