import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { NotificationsService, SmartNotification } from './notifications.service';

@Injectable()
export class HealthAwareNotificationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async checkHealthConditionCompliance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        conditions: {
          include: { condition: true },
        },
        allergies: {
          include: { allergy: true },
        },
        mealLogs: {
          where: {
            date: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24h
            },
          },
        },
      },
    });

    if (!user) return;

    // Verificar condiciones específicas
    for (const userCondition of user.conditions) {
      await this.checkConditionSpecificRules(user, userCondition.condition);
    }

    // Verificar alergias en comidas recientes
    await this.checkAllergenExposure(user);
  }

  private async checkConditionSpecificRules(user: any, condition: any) {
    switch (condition.code) {
      case 'DIABETES_TYPE_2':
        await this.checkDiabetesCompliance(user);
        break;
      case 'HYPERTENSION':
        await this.checkHypertensionCompliance(user);
        break;
      case 'HEART_DISEASE':
        await this.checkHeartDiseaseCompliance(user);
        break;
      case 'KIDNEY_DISEASE':
        await this.checkKidneyDiseaseCompliance(user);
        break;
    }
  }

  private async checkDiabetesCompliance(user: any) {
    const todayMeals = user.mealLogs.filter(meal => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return meal.date >= today;
    });

    const totalCarbs = todayMeals.reduce((sum, meal) => sum + meal.carbs_g, 0);
    const highCarbMeals = todayMeals.filter(meal => meal.carbs_g > 45).length;

    if (highCarbMeals >= 3 || totalCarbs > 200) {
      const notification: SmartNotification = {
        title: '🩺 Recordatorio para tu diabetes',
        body: `Has consumido ${totalCarbs}g de carbohidratos hoy. ¿Revisamos tu glucosa?`,
        actions: [
          { label: 'Registrar Glucosa', action: 'log_glucose' },
          { label: 'Comidas Balanceadas', action: 'balanced_meals' },
          { label: 'Contactar Médico', action: 'contact_doctor' },
        ],
        type: 'diabetes_carb_warning',
        priority: 'high',
        metadata: { totalCarbs, highCarbMeals },
      };

      await this.notificationsService.createNotification(user.id, notification);
    }
  }

  private async checkHypertensionCompliance(user: any) {
    const todayMeals = user.mealLogs.filter(meal => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return meal.date >= today;
    });

    // Buscar comidas altas en sodio (estimación basada en tipo de comida)
    const highSodiumKeywords = ['pizza', 'sopa', 'enlatado', 'procesado', 'embutido', 'queso'];
    const potentialHighSodiumMeals = todayMeals.filter(meal =>
      highSodiumKeywords.some(keyword => 
        meal.title.toLowerCase().includes(keyword) ||
        (meal.notes && meal.notes.toLowerCase().includes(keyword))
      )
    );

    if (potentialHighSodiumMeals.length >= 2) {
      const notification: SmartNotification = {
        title: '🧂 Cuidado con el sodio',
        body: 'Has consumido varias comidas altas en sodio hoy. Esto puede afectar tu presión arterial.',
        actions: [
          { label: 'Alternativas Bajas en Sodio', action: 'low_sodium_alternatives' },
          { label: 'Registrar Presión', action: 'log_blood_pressure' },
          { label: 'Consejos Hipertensión', action: 'hypertension_tips' },
        ],
        type: 'hypertension_sodium_warning',
        priority: 'medium',
      };

      await this.notificationsService.createNotification(user.id, notification);
    }
  }

  private async checkHeartDiseaseCompliance(user: any) {
    // Verificar actividad física para usuarios con enfermedad cardíaca
    const recentActivity = await this.prisma.activityLog.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'desc' },
    });

    const recentWorkout = await this.prisma.workoutDay.findFirst({
      where: {
        workoutPlan: { userId: user.id },
        completed: true,
        completedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Si hizo ejercicio intenso, recordar precauciones
    if (recentWorkout && recentWorkout.durationMinutes && recentWorkout.durationMinutes > 45) {
      const notification: SmartNotification = {
        title: '❤️ Ejercicio y tu corazón',
        body: 'Hiciste un entrenamiento intenso. ¿Cómo te sientes? Recuerda monitorear tu frecuencia cardíaca.',
        actions: [
          { label: 'Me siento bien', action: 'feeling_good' },
          { label: 'Un poco cansado', action: 'feeling_tired' },
          { label: 'Contactar Médico', action: 'contact_doctor' },
        ],
        type: 'heart_disease_exercise_check',
        priority: 'medium',
      };

      await this.notificationsService.createNotification(user.id, notification);
    }
  }

  private async checkKidneyDiseaseCompliance(user: any) {
    const todayMeals = user.mealLogs.filter(meal => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return meal.date >= today;
    });

    const totalProtein = todayMeals.reduce((sum, meal) => sum + meal.protein_g, 0);

    // Para enfermedad renal, el exceso de proteína puede ser problemático
    if (totalProtein > 100) { // Límite conservador
      const notification: SmartNotification = {
        title: '🫘 Cuidado con las proteínas',
        body: `Has consumido ${totalProtein}g de proteína hoy. Para tu condición renal, es importante moderar el consumo.`,
        actions: [
          { label: 'Ajustar Comidas', action: 'adjust_protein' },
          { label: 'Hablar con Nefrólogo', action: 'contact_nephrologist' },
          { label: 'Proteínas Recomendadas', action: 'kidney_friendly_proteins' },
        ],
        type: 'kidney_disease_protein_warning',
        priority: 'high',
      };

      await this.notificationsService.createNotification(user.id, notification);
    }
  }

  private async checkAllergenExposure(user: any) {
    const allergenNames = user.allergies.map(a => a.allergy.name.toLowerCase());
    
    for (const meal of user.mealLogs) {
      const mealText = `${meal.title} ${meal.notes || ''}`.toLowerCase();
      
      const detectedAllergens = allergenNames.filter(allergen =>
        mealText.includes(allergen)
      );

      if (detectedAllergens.length > 0) {
        const notification: SmartNotification = {
          title: '⚠️ Posible alérgeno detectado',
          body: `La comida "${meal.title}" podría contener ${detectedAllergens.join(', ')}. ¿Estás seguro que es correcta?`,
          actions: [
            { label: 'Corregir Registro', action: 'correct_meal_log', data: { mealId: meal.id } },
            { label: 'Confirmar', action: 'confirm_meal' },
            { label: 'Lista de Alérgenos', action: 'view_allergens' },
          ],
          type: 'allergen_warning',
          priority: 'high',
          metadata: { allergens: detectedAllergens, mealId: meal.id },
        };

        await this.notificationsService.createNotification(user.id, notification);
      }
    }
  }

  // Notificaciones preventivas basadas en condiciones
  async sendPreventiveReminders(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        conditions: {
          include: { condition: true },
        },
      },
    });

    if (!user) return;

    for (const userCondition of user.conditions) {
      switch (userCondition.condition.code) {
        case 'DIABETES_TYPE_2':
          await this.sendDiabetesReminders(user);
          break;
        case 'HYPERTENSION':
          await this.sendHypertensionReminders(user);
          break;
      }
    }
  }

  private async sendDiabetesReminders(user: any) {
    // Recordatorio para medir glucosa si no lo ha hecho
    const notification: SmartNotification = {
      title: '📊 Recordatorio de glucosa',
      body: '¿Ya mediste tu glucosa hoy? Es importante mantener el control.',
      actions: [
        { label: 'Registrar Glucosa', action: 'log_glucose' },
        { label: 'Ya la medí', action: 'glucose_measured' },
        { label: 'Recordar más tarde', action: 'remind_later' },
      ],
      type: 'diabetes_glucose_reminder',
      priority: 'medium',
    };

    await this.notificationsService.createNotification(user.id, notification);
  }

  private async sendHypertensionReminders(user: any) {
    const notification: SmartNotification = {
      title: '💓 Control de presión arterial',
      body: 'Recuerda tomar tu presión arterial regularmente para mantener un buen control.',
      actions: [
        { label: 'Registrar Presión', action: 'log_blood_pressure' },
        { label: 'Ya la tomé', action: 'bp_measured' },
        { label: 'Consejos para Bajarla', action: 'bp_tips' },
      ],
      type: 'hypertension_bp_reminder',
      priority: 'medium',
    };

    await this.notificationsService.createNotification(user.id, notification);
  }
}