import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RunHealthMonitoringCronUseCase } from '../../core/application/chapi/use-cases/run-health-monitoring-cron.usecase';

@Controller('admin/chapi')
@UseGuards(JwtAuthGuard)
export class ChapiAdminController {
  constructor(
    private readonly healthMonitoringCron: RunHealthMonitoringCronUseCase,
  ) {}

  @Get('monitoring-stats')
  async getMonitoringStats(@Request() req: any) {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'ADMIN') {
      throw new Error('Acceso denegado: Se requieren permisos de administrador');
    }

    return await this.healthMonitoringCron.getMonitoringStats();
  }

  @Post('run-health-check')
  async runManualHealthCheck(@Request() req: any) {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'ADMIN') {
      throw new Error('Acceso denegado: Se requieren permisos de administrador');
    }

    const result = await this.healthMonitoringCron.runManualHealthCheck();
    
    return {
      success: true,
      message: 'Monitoreo de salud ejecutado exitosamente',
      ...result,
      executedAt: new Date().toISOString()
    };
  }

  @Get('system-status')
  async getSystemStatus(@Request() req: any) {
    // Verificar que el usuario sea admin
    if (req.user.role !== 'ADMIN') {
      throw new Error('Acceso denegado: Se requieren permisos de administrador');
    }

    const stats = await this.healthMonitoringCron.getMonitoringStats();
    
    return {
      status: 'operational',
      version: '2.0.0',
      features: {
        contextualChat: true,
        healthMonitoring: true,
        proactiveNotifications: true,
        riskAnalysis: true
      },
      monitoring: stats,
      lastUpdate: new Date().toISOString()
    };
  }
}