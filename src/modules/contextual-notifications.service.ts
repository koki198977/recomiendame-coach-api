import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { NotificationsService, SmartNotification } from './notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  uvIndex?: number;
}

@Injectable()
export class ContextualNotificationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Simulación de API del clima - en producción usarías OpenWeatherMap, etc.
  private async getWeatherData(country: string): Promise<WeatherData> {
    // Simulación - en producción harías una llamada real a la API
    const mockWeather: Record<string, WeatherData> = {
      'MX': { temperature: 24, condition: 'sunny', humidity: 45, uvIndex: 7 },
      'US': { temperature: 18, condition: 'cloudy', humidity: 60, uvIndex: 4 },
      'ES': { temperature: 22, condition: 'sunny', humidity: 50, uvIndex: 6 },
      'default': { temperature: 20, condition: 'partly_cloudy', humidity: 55, uvIndex: 5 },
    };

    return mockWeather[country] || mockWeather['default'];
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async sendWeatherBasedNotifications() {
    const users = await this.prisma.user.findMany({
      include: {
        profile: true,
        workoutPlans: {
          where: {
            weekStart: {
              lte: new Date(),
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            days: {
              where: {
                dayIndex: new Date().getDay(),
                completed: false,
              },
            },
          },
        },
      },
    });

    for (const user of users) {
      if (user.profile?.country) {
        const weather = await this.getWeatherData(user.profile.country);
        await this.processWeatherBasedNotifications(user, weather);
      }
    }
  }

  private async processWeatherBasedNotifications(user: any, weather: WeatherData) {
    const hasWorkoutToday = user.workoutPlans.some(plan => plan.days.length > 0);

    // Clima perfecto para ejercitarse
    if (weather.temperature >= 18 && weather.temperature <= 25 && weather.condition === 'sunny' && hasWorkoutToday) {
      const notification: SmartNotification = {
        title: '☀️ ¡Día perfecto para ejercitarse!',
        body: `${weather.temperature}°C y soleado. Ideal para tu entrenamiento de hoy.`,
        actions: [
          { label: 'Iniciar Entrenamiento', action: 'start_workout' },
          { label: 'Ejercicio al Aire Libre', action: 'outdoor_workout' },
          { label: 'Cambiar Plan', action: 'change_plan' },
        ],
        type: 'weather_perfect_workout',
        priority: 'medium',
        metadata: { weather },
      };

      await this.notificationsService.createNotification(user.id, notification);
    }

    // Clima muy caluroso - recordar hidratación
    if (weather.temperature > 30) {
      const notification: SmartNotification = {
        title: '🌡️ Día muy caluroso',
        body: `${weather.temperature}°C hoy. Recuerda hidratarte extra y evita ejercicio intenso al mediodía.`,
        actions: [
          { label: 'Aumentar Meta de Agua', action: 'increase_water_goal' },
          { label: 'Ejercicio Temprano', action: 'early_workout' },
          { label: 'Consejos para Calor', action: 'heat_tips' },
        ],
        type: 'weather_hot_warning',
        priority: 'high',
      };

      await this.notificationsService.createNotification(user.id, notification);
    }

    // Lluvia - sugerir ejercicio en casa
    if (weather.condition === 'rainy' && hasWorkoutToday) {
      const notification: SmartNotification = {
        title: '🌧️ Lluvia no es excusa',
        body: 'Está lloviendo, pero puedes hacer tu entrenamiento en casa. ¡No rompas tu racha!',
        actions: [
          { label: 'Rutina en Casa', action: 'indoor_workout' },
          { label: 'Yoga/Estiramientos', action: 'yoga_stretching' },
          { label: 'Posponer a Mañana', action: 'postpone_workout' },
        ],
        type: 'weather_rainy_indoor',
        priority: 'medium',
      };

      await this.notificationsService.createNotification(user.id, notification);
    }

    // UV alto - protección solar
    if (weather.uvIndex && weather.uvIndex > 6 && hasWorkoutToday) {
      const notification: SmartNotification = {
        title: '☀️ UV alto hoy',
        body: `Índice UV de ${weather.uvIndex}. Si entrenas al aire libre, usa protección solar.`,
        actions: [
          { label: 'Entrenar en Sombra', action: 'shaded_workout' },
          { label: 'Ejercicio Matutino', action: 'morning_workout' },
          { label: 'Gimnasio/Interior', action: 'indoor_gym' },
        ],
        type: 'weather_high_uv',
        priority: 'medium',
      };

      await this.notificationsService.createNotification(user.id, notification);
    }
  }

  // Notificaciones basadas en fechas especiales
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendSpecialDateNotifications() {
    const users = await this.prisma.user.findMany({
      include: {
        profile: true,
        checkins: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const today = new Date();

    for (const user of users) {
      // Cumpleaños
      if (user.profile?.birthDate) {
        const birthDate = new Date(user.profile.birthDate);
        if (birthDate.getMonth() === today.getMonth() && birthDate.getDate() === today.getDate()) {
          await this.sendBirthdayNotification(user);
        }
      }

      // Aniversario de registro
      const registrationDate = new Date(user.createdAt);
      if (registrationDate.getMonth() === today.getMonth() && registrationDate.getDate() === today.getDate()) {
        const yearsActive = today.getFullYear() - registrationDate.getFullYear();
        if (yearsActive > 0) {
          await this.sendAnniversaryNotification(user, yearsActive);
        }
      }

      // Lunes - motivación semanal
      if (today.getDay() === 1) {
        await this.sendMondayMotivation(user);
      }

      // Viernes - resumen semanal
      if (today.getDay() === 5) {
        await this.sendWeeklyReview(user);
      }
    }
  }

  private async sendBirthdayNotification(user: any) {
    // Calcular progreso desde el registro
    const startWeight = await this.prisma.checkin.findFirst({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
    });

    const currentWeight = user.checkins[0];
    let progressText = '';

    if (startWeight && currentWeight && startWeight.weightKg && currentWeight.weightKg) {
      const weightLoss = Number(startWeight.weightKg) - Number(currentWeight.weightKg);
      if (weightLoss > 0) {
        progressText = ` ¡${weightLoss.toFixed(1)}kg perdidos desde que empezaste!`;
      }
    }

    const notification: SmartNotification = {
      title: '🎉 ¡Feliz cumpleaños!',
      body: `En tu día especial, recuerda lo lejos que has llegado.${progressText}`,
      actions: [
        { label: 'Ver Progreso', action: 'view_progress' },
        { label: 'Foto Antes/Después', action: 'before_after_photo' },
        { label: 'Compartir Logro', action: 'share_achievement' },
      ],
      type: 'birthday_celebration',
      priority: 'high',
    };

    await this.notificationsService.createNotification(user.id, notification);
  }

  private async sendAnniversaryNotification(user: any, years: number) {
    const notification: SmartNotification = {
      title: `🎊 ¡${years} año${years > 1 ? 's' : ''} juntos!`,
      body: `Hace ${years} año${years > 1 ? 's' : ''} comenzaste tu viaje de transformación. ¡Qué orgullo!`,
      actions: [
        { label: 'Ver Estadísticas', action: 'view_stats' },
        { label: 'Compartir Experiencia', action: 'share_journey' },
        { label: 'Nuevo Objetivo', action: 'set_new_goal' },
      ],
      type: 'anniversary_celebration',
      priority: 'medium',
    };

    await this.notificationsService.createNotification(user.id, notification);
  }

  private async sendMondayMotivation(user: any) {
    const motivationalMessages = [
      'Nueva semana, nuevas oportunidades de crecer',
      'Los lunes son para empezar con energía renovada',
      'Esta semana será mejor que la anterior',
      'Cada lunes es un nuevo comienzo',
      'Tu futuro yo te agradecerá lo que hagas hoy',
    ];

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    const notification: SmartNotification = {
      title: '💪 ¡Lunes de motivación!',
      body: randomMessage,
      actions: [
        { label: 'Ver Objetivos Semanales', action: 'weekly_goals' },
        { label: 'Planificar Semana', action: 'plan_week' },
        { label: 'Empezar Fuerte', action: 'start_strong' },
      ],
      type: 'monday_motivation',
      priority: 'low',
    };

    await this.notificationsService.createNotification(user.id, notification);
  }

  private async sendWeeklyReview(user: any) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weeklyCheckins = await this.prisma.checkin.count({
      where: {
        userId: user.id,
        date: { gte: weekStart },
      },
    });

    const weeklyWorkouts = await this.prisma.workoutDay.count({
      where: {
        workoutPlan: { userId: user.id },
        completed: true,
        completedAt: { gte: weekStart },
      },
    });

    const notification: SmartNotification = {
      title: '📊 Resumen de tu semana',
      body: `Esta semana: ${weeklyCheckins} check-ins y ${weeklyWorkouts} entrenamientos completados. ¡Buen trabajo!`,
      actions: [
        { label: 'Ver Detalles', action: 'weekly_details' },
        { label: 'Planificar Fin de Semana', action: 'plan_weekend' },
        { label: 'Compartir Progreso', action: 'share_weekly_progress' },
      ],
      type: 'weekly_review',
      priority: 'low',
      metadata: { checkins: weeklyCheckins, workouts: weeklyWorkouts },
    };

    await this.notificationsService.createNotification(user.id, notification);
  }

  // Notificaciones basadas en ubicación/zona horaria
  async sendTimezoneBasedNotifications(userId: string, timezone: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) return;

    // Aquí podrías usar la zona horaria para enviar notificaciones en el momento óptimo
    // Por ejemplo, recordatorios de comida basados en la hora local del usuario
    
    const userLocalTime = new Date().toLocaleString('en-US', { timeZone: timezone });
    const localHour = new Date(userLocalTime).getHours();

    // Recordatorio de desayuno (7-9 AM hora local)
    if (localHour >= 7 && localHour <= 9) {
      const notification: SmartNotification = {
        title: '🌅 ¡Buenos días!',
        body: 'Es un buen momento para un desayuno nutritivo. ¿Ya planeaste qué comer?',
        actions: [
          { label: 'Ver Desayunos', action: 'view_breakfast_options' },
          { label: 'Registrar Desayuno', action: 'log_breakfast' },
          { label: 'Ya desayuné', action: 'breakfast_done' },
        ],
        type: 'timezone_breakfast_reminder',
        priority: 'low',
      };

      await this.notificationsService.createNotification(userId, notification);
    }
  }
}