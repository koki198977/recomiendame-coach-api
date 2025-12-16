import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HEALTH_MONITOR, HealthMonitorPort } from '../ports/out.health-monitor.port';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class RunHealthMonitoringCronUseCase {
  private readonly logger = new Logger(RunHealthMonitoringCronUseCase.name);

  constructor(
    @Inject(HEALTH_MONITOR) private readonly healthMonitor: HealthMonitorPort,
    private readonly prisma: PrismaService,
  ) {}

  // Ejecutar cada día a las 9:00 AM
  @Cron('0 9 * * *', {
    name: 'daily-health-monitoring',
    timeZone: 'America/Santiago',
  })
  async runDailyHealthMonitoring() {
    this.logger.log('🏥 Iniciando monitoreo diario de salud...');

    try {
      const result = await this.healthMonitor.analyzeAllUsers();
      
      this.logger.log(`✅ Monitoreo completado:
        - Usuarios analizados: ${result.usersAnalyzed}
        - Alertas generadas: ${result.alertsGenerated}
        - Notificaciones programadas: ${result.notificationsScheduled}`);

      // Aquí podrías enviar las notificaciones push reales
      await this.sendScheduledNotifications();

    } catch (error) {
      this.logger.error('❌ Error en monitoreo diario:', error);
    }
  }

  // Ejecutar cada 3 horas para usuarios de alto riesgo
  @Cron('0 */3 * * *', {
    name: 'high-risk-monitoring',
    timeZone: 'America/Santiago',
  })
  async runHighRiskMonitoring() {
    this.logger.log('🚨 Monitoreando usuarios de alto riesgo...');

    try {
      // Obtener usuarios que no han hecho check-in en más de 3 días
      const highRiskUsers = await this.prisma.user.findMany({
        where: {
          checkins: {
            none: {
              date: {
                gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 días
              }
            }
          }
        },
        select: { id: true, email: true }
      });

      let notificationsSent = 0;

      for (const user of highRiskUsers) {
        const notifications = await this.healthMonitor.generateProactiveNotifications({
          userId: user.id
        });

        // Filtrar solo notificaciones de alta prioridad
        const highPriorityNotifications = notifications.filter(n => n.priority === 'HIGH');
        
        if (highPriorityNotifications.length > 0) {
          // Aquí enviarías las notificaciones push
          this.logger.log(`📱 Enviando ${highPriorityNotifications.length} notificaciones a usuario ${user.id}`);
          notificationsSent += highPriorityNotifications.length;
        }
      }

      this.logger.log(`✅ Monitoreo de alto riesgo completado: ${notificationsSent} notificaciones enviadas`);

    } catch (error) {
      this.logger.error('❌ Error en monitoreo de alto riesgo:', error);
    }
  }

  // Método manual para ejecutar el monitoreo
  async runManualHealthCheck(): Promise<{
    usersAnalyzed: number;
    alertsGenerated: number;
    notificationsScheduled: number;
  }> {
    this.logger.log('🔧 Ejecutando monitoreo manual...');
    
    const result = await this.healthMonitor.analyzeAllUsers();
    await this.sendScheduledNotifications();
    
    return result;
  }

  private async sendScheduledNotifications() {
    // Aquí implementarías el envío real de notificaciones push
    // Por ejemplo, usando Firebase Cloud Messaging, OneSignal, etc.
    
    this.logger.log('📱 Enviando notificaciones push programadas...');
    
    // Ejemplo de estructura para envío de notificaciones:
    /*
    const notifications = await this.getScheduledNotifications();
    
    for (const notification of notifications) {
      await this.pushNotificationService.send({
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        actions: notification.actionButtons
      });
    }
    */
  }

  // Método para obtener estadísticas del sistema
  async getMonitoringStats(): Promise<{
    totalUsers: number;
    usersWithRecentCheckins: number;
    usersAtRisk: number;
    averageRiskScore: number;
  }> {
    const totalUsers = await this.prisma.user.count({
      where: { profile: { isNot: null } }
    });

    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días
    const usersWithRecentCheckins = await this.prisma.user.count({
      where: {
        checkins: {
          some: {
            date: { gte: recentDate }
          }
        }
      }
    });

    // Para calcular usuarios en riesgo y score promedio, necesitarías
    // almacenar estos datos o calcularlos en tiempo real
    const usersAtRisk = totalUsers - usersWithRecentCheckins; // Simplificado
    const averageRiskScore = 25; // Placeholder

    return {
      totalUsers,
      usersWithRecentCheckins,
      usersAtRisk,
      averageRiskScore
    };
  }
}