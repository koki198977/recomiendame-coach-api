import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { NotificationsService, SmartNotification } from './notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationTriggersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // 🍽️ NOTIFICACIONES NUTRICIONALES

  @Cron(CronExpression.EVERY_DAY_AT_8PM)
  async checkAdherencePatterns() {
    const users = await this.prisma.user.findMany({
      include: {
        checkins: {
          where: {
            date: {
              gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // últimos 3 días
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    for (const user of users) {
      const avgAdherence = user.checkins.reduce((sum, c) => sum + (c.adherencePct || 0), 0) / user.checkins.length;
      
      if (avgAdherence < 70 && user.checkins.length >= 3) {
        const notification: SmartNotification = {
          title: '📊 Tu adherencia ha bajado',
          body: `Solo has seguido el ${Math.round(avgAdherence)}% de tu plan esta semana. ¿Necesitas ajustar las comidas?`,
          actions: [
            { label: 'Simplificar Plan', action: 'simplify_plan' },
            { label: 'Cambiar Recetas', action: 'change_recipes' },
            { label: 'Hablar con Nutricionista', action: 'contact_nutritionist' },
          ],
          type: 'adherence_low',
          priority: 'medium',
        };

        await this.notificationsService.createNotification(user.id, notification);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7PM)
  async checkMissingMealLogs() {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    const users = await this.prisma.user.findMany({
      include: {
        mealLogs: {
          where: {
            date: { gte: threeDaysAgo },
          },
        },
      },
    });

    for (const user of users) {
      if (user.mealLogs.length === 0) {
        const notification: SmartNotification = {
          title: '🍽️ ¿Cómo van tus comidas?',
          body: 'No has registrado comidas en 3 días. Esto me ayuda a personalizar mejor tu plan.',
          actions: [
            { label: 'Registrar Comida', action: 'log_meal' },
            { label: 'Foto Rápida', action: 'quick_photo' },
            { label: 'Recordatorio Automático', action: 'set_reminder' },
          ],
          type: 'meal_log_missing',
          priority: 'medium',
        };

        await this.notificationsService.createNotification(user.id, notification);
      }
    }
  }

  async checkNutritionalBalance(userId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const mealLogs = await this.prisma.mealLog.findMany({
      where: {
        userId,
        date: { gte: weekAgo },
      },
    });

    const totalCarbs = mealLogs.reduce((sum, log) => sum + log.carbs_g, 0);
    const totalProtein = mealLogs.reduce((sum, log) => sum + log.protein_g, 0);
    const totalFat = mealLogs.reduce((sum, log) => sum + log.fat_g, 0);

    // Obtener el plan actual del usuario para comparar
    const currentPlan = await this.prisma.plan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (currentPlan && mealLogs.length > 0) {
      const targetCarbs = currentPlan.carbs_g * 7; // objetivo semanal
      const carbsDeviation = ((totalCarbs - targetCarbs) / targetCarbs) * 100;

      if (Math.abs(carbsDeviation) > 30) {
        const isOver = carbsDeviation > 0;
        const notification: SmartNotification = {
          title: '⚖️ Ajustemos tus macros',
          body: `Has consumido ${Math.abs(Math.round(carbsDeviation))}% ${isOver ? 'más' : 'menos'} carbohidratos de lo planeado. ¿Te ayudo a balancear?`,
          actions: [
            { label: 'Ver Recomendaciones', action: 'view_recommendations' },
            { label: 'Ajustar Plan', action: 'adjust_plan' },
            { label: 'Recetas Altas en Proteína', action: 'protein_recipes' },
          ],
          type: 'nutritional_imbalance',
          priority: 'medium',
        };

        await this.notificationsService.createNotification(userId, notification);
      }
    }
  }

  // 💧 NOTIFICACIONES DE HIDRATACIÓN

  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async checkDailyHydration() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      include: {
        hydrationLogs: {
          where: {
            date: { gte: today },
          },
        },
      },
    });

    for (const user of users) {
      const totalMl = user.hydrationLogs.reduce((sum, log) => sum + log.ml, 0);
      const goal = user.hydrationGoal ? (user.hydrationGoal as any).dailyMl || 2000 : 2000;

      if (totalMl < goal * 0.75) { // menos del 75% del objetivo
        const notification: SmartNotification = {
          title: '💧 ¡Necesitas más agua!',
          body: `Solo has tomado ${totalMl}ml hoy. Tu objetivo son ${goal}ml. ¿Configuramos recordatorios?`,
          actions: [
            { label: 'Recordatorio cada 2h', action: 'set_hydration_reminder' },
            { label: 'Tracking Automático', action: 'auto_tracking' },
            { label: 'Consejos de Hidratación', action: 'hydration_tips' },
          ],
          type: 'hydration_low',
          priority: 'medium',
        };

        await this.notificationsService.createNotification(user.id, notification);
      }
    }
  }

  // 😴 NOTIFICACIONES DE SUEÑO

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkSleepPatterns() {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    const users = await this.prisma.user.findMany({
      include: {
        sleepLogs: {
          where: {
            date: { gte: threeDaysAgo },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    for (const user of users) {
      const recentSleep = user.sleepLogs.slice(0, 3);
      const avgHours = recentSleep.reduce((sum, log) => sum + Number(log.hours), 0) / recentSleep.length;
      const avgQuality = recentSleep.reduce((sum, log) => sum + (log.quality || 0), 0) / recentSleep.length;

      if (avgHours < 6 && recentSleep.length >= 3) {
        const notification: SmartNotification = {
          title: '😴 Tu sueño está afectando tu progreso',
          body: `Has dormido menos de 6h por 3 días. Esto puede sabotear tu pérdida de peso.`,
          actions: [
            { label: 'Rutina de Sueño', action: 'sleep_routine' },
            { label: 'Consejos para Dormir', action: 'sleep_tips' },
            { label: 'Ajustar Horarios', action: 'adjust_schedule' },
          ],
          type: 'sleep_insufficient',
          priority: 'high',
        };

        await this.notificationsService.createNotification(user.id, notification);
      }

      if (avgQuality < 3 && recentSleep.length >= 3) {
        const notification: SmartNotification = {
          title: '🌙 Tu calidad de sueño ha empeorado',
          body: `Tu puntuación de sueño promedio es ${avgQuality.toFixed(1)}/5 esta semana. ¿Revisamos qué está pasando?`,
          actions: [
            { label: 'Análisis de Sueño', action: 'sleep_analysis' },
            { label: 'Higiene del Sueño', action: 'sleep_hygiene' },
            { label: 'Factores Ambientales', action: 'environmental_factors' },
          ],
          type: 'sleep_quality_low',
          priority: 'medium',
        };

        await this.notificationsService.createNotification(user.id, notification);
      }
    }
  }

  // 🏃‍♂️ NOTIFICACIONES DE ACTIVIDAD FÍSICA

  @Cron(CronExpression.EVERY_DAY_AT_7PM)
  async checkWorkoutCompletion() {
    const users = await this.prisma.user.findMany({
      include: {
        workoutPlans: {
          where: {
            weekStart: {
              lte: new Date(),
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            days: true,
          },
        },
      },
    });

    for (const user of users) {
      const currentPlan = user.workoutPlans[0];
      if (currentPlan) {
        const incompleteDays = currentPlan.days.filter(day => !day.completed);
        
        if (incompleteDays.length >= 3) {
          const notification: SmartNotification = {
            title: '💪 ¿Qué pasó con tus entrenamientos?',
            body: `Tienes ${incompleteDays.length} entrenamientos pendientes esta semana. ¿Necesitas un plan más flexible?`,
            actions: [
              { label: 'Entrenamientos Cortos', action: 'short_workouts' },
              { label: 'Cambiar Horario', action: 'reschedule_workouts' },
              { label: 'Ejercicios en Casa', action: 'home_workouts' },
            ],
            type: 'workout_incomplete',
            priority: 'medium',
          };

          await this.notificationsService.createNotification(user.id, notification);
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8PM)
  async checkActivityLevels() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      include: {
        activityLogs: {
          where: {
            date: { gte: yesterday },
          },
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    for (const user of users) {
      const latestActivity = user.activityLogs[0];
      
      if (latestActivity && latestActivity.steps && latestActivity.steps < 5000) {
        const notification: SmartNotification = {
          title: '🚶‍♂️ ¡Muévete un poco más!',
          body: `Solo ${latestActivity.steps.toLocaleString()} pasos ayer. Pequeños cambios pueden hacer gran diferencia.`,
          actions: [
            { label: 'Caminata de 10min', action: 'quick_walk' },
            { label: 'Subir Escaleras', action: 'stairs_challenge' },
            { label: 'Ejercicios de Escritorio', action: 'desk_exercises' },
          ],
          type: 'sedentary_detected',
          priority: 'low',
        };

        await this.notificationsService.createNotification(user.id, notification);
      }
    }
  }

  // 🎯 NOTIFICACIONES DE OBJETIVOS

  async checkGoalProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        goals: {
          where: {
            endDate: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (user?.goals[0] && user.profile?.weightKg) {
      const goal = user.goals[0];
      const currentWeight = Number(user.profile.weightKg);
      const targetWeight = Number(goal.targetWeightKg);
      const difference = Math.abs(currentWeight - targetWeight);

      if (difference <= 1.5) { // Cerca del objetivo
        const notification: SmartNotification = {
          title: '🎉 ¡Casi logras tu objetivo!',
          body: `Solo te faltan ${difference.toFixed(1)}kg para llegar a tu meta. ¡Estás increíble!`,
          actions: [
            { label: 'Plan de Mantenimiento', action: 'maintenance_plan' },
            { label: 'Nuevo Objetivo', action: 'new_goal' },
            { label: 'Celebrar Logro', action: 'celebrate' },
          ],
          type: 'goal_near_completion',
          priority: 'high',
        };

        await this.notificationsService.createNotification(userId, notification);
      }
    }
  }

  // 🏆 NOTIFICACIONES DE GAMIFICACIÓN

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async checkStreaks() {
    const users = await this.prisma.user.findMany({
      include: {
        streak: true,
        checkins: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        },
      },
    });

    for (const user of users) {
      if (user.streak && user.streak.days >= 7 && user.checkins.length === 0) {
        const notification: SmartNotification = {
          title: '🔥 ¡Tu racha está en peligro!',
          body: `Tu racha de ${user.streak.days} días está en peligro. ¿5 minutos para mantenerla?`,
          actions: [
            { label: 'Check-in Rápido', action: 'quick_checkin' },
            { label: 'Registrar Peso', action: 'log_weight' },
            { label: 'Foto de Comida', action: 'food_photo' },
          ],
          type: 'streak_danger',
          priority: 'high',
        };

        await this.notificationsService.createNotification(user.id, notification);
      }
    }
  }

  // 🧠 NOTIFICACIONES DE BIENESTAR EMOCIONAL

  async checkEmotionalPatterns(userId: string) {
    const recentEmotions = await this.prisma.emotionalLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const negativeEmotions = ['SADNESS', 'ANXIETY', 'FRUSTRATION', 'ANGER'];
    const recentNegative = recentEmotions.filter(log => 
      negativeEmotions.includes(log.emotion)
    );

    if (recentNegative.length >= 3) {
      const notification: SmartNotification = {
        title: '💙 He notado que te sientes desanimado',
        body: 'En tus últimas interacciones has expresado frustración. ¿Hablamos?',
        actions: [
          { label: 'Sesión de Apoyo', action: 'support_session' },
          { label: 'Técnicas de Relajación', action: 'relaxation_techniques' },
          { label: 'Contactar Profesional', action: 'contact_professional' },
        ],
        type: 'emotional_negative_pattern',
        priority: 'high',
      };

      await this.notificationsService.createNotification(userId, notification);
    }
  }

  // Método para trigger manual de notificaciones específicas
  async triggerNotification(userId: string, type: string, data?: any) {
    switch (type) {
      case 'nutritional_balance':
        await this.checkNutritionalBalance(userId);
        break;
      case 'goal_progress':
        await this.checkGoalProgress(userId);
        break;
      case 'emotional_patterns':
        await this.checkEmotionalPatterns(userId);
        break;
      default:
        console.log(`Tipo de notificación no reconocido: ${type}`);
    }
  }
}