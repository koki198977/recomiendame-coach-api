import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { NotificationsService, SmartNotification } from './notifications.service';

interface CorrelationInsight {
  factor1: string;
  factor2: string;
  correlation: number;
  insight: string;
  actionable: boolean;
}

@Injectable()
export class SmartAnalyticsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async analyzeUserPatterns(userId: string): Promise<CorrelationInsight[]> {
    const insights: CorrelationInsight[] = [];

    // Correlación sueño-hambre
    const sleepHungerCorrelation = await this.analyzeSleepHungerCorrelation(userId);
    if (sleepHungerCorrelation) {
      insights.push(sleepHungerCorrelation);
    }

    // Correlación actividad-adherencia
    const activityAdherenceCorrelation = await this.analyzeActivityAdherenceCorrelation(userId);
    if (activityAdherenceCorrelation) {
      insights.push(activityAdherenceCorrelation);
    }

    // Correlación emociones-comida
    const emotionFoodCorrelation = await this.analyzeEmotionFoodCorrelation(userId);
    if (emotionFoodCorrelation) {
      insights.push(emotionFoodCorrelation);
    }

    return insights;
  }

  private async analyzeSleepHungerCorrelation(userId: string): Promise<CorrelationInsight | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const sleepLogs = await this.prisma.sleepLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const checkins = await this.prisma.checkin.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    if (sleepLogs.length < 10 || checkins.length < 10) return null;

    // Correlación simple: días con poco sueño vs nivel de hambre
    const correlationData = sleepLogs
      .map(sleep => {
        const matchingCheckin = checkins.find(c => 
          Math.abs(c.date.getTime() - sleep.date.getTime()) < 24 * 60 * 60 * 1000
        );
        return matchingCheckin ? {
          sleep: Number(sleep.hours),
          hunger: matchingCheckin.hungerLvl || 0,
        } : null;
      })
      .filter((d): d is { sleep: number; hunger: number } => d !== null);

    if (correlationData.length < 5) return null;

    const lowSleepData = correlationData.filter(d => d.sleep < 6);
    const goodSleepData = correlationData.filter(d => d.sleep >= 7);

    if (lowSleepData.length === 0 || goodSleepData.length === 0) return null;

    const avgSleepLow = lowSleepData.reduce((sum, d) => sum + d.hunger, 0) / lowSleepData.length;
    const avgSleepGood = goodSleepData.reduce((sum, d) => sum + d.hunger, 0) / goodSleepData.length;

    if (avgSleepLow > avgSleepGood + 1.5) {
      // Enviar notificación de correlación detectada
      const notification: SmartNotification = {
        title: '🧠 Patrón interesante detectado',
        body: `Cuando duermes <6h, tu nivel de hambre sube a ${avgSleepLow.toFixed(1)}/10. ¿Priorizamos el sueño?`,
        actions: [
          { label: 'Mejorar Sueño', action: 'improve_sleep' },
          { label: 'Estrategias Anti-Hambre', action: 'hunger_strategies' },
          { label: 'Ver Análisis', action: 'view_analysis' },
        ],
        type: 'correlation_sleep_hunger',
        priority: 'medium',
      };

      await this.notificationsService.createNotification(userId, notification);

      return {
        factor1: 'sleep',
        factor2: 'hunger',
        correlation: 0.8,
        insight: `Poco sueño aumenta tu hambre en promedio ${(avgSleepLow - avgSleepGood).toFixed(1)} puntos`,
        actionable: true,
      };
    }

    return null;
  }

  private async analyzeActivityAdherenceCorrelation(userId: string): Promise<CorrelationInsight | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activityLogs = await this.prisma.activityLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const checkins = await this.prisma.checkin.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    if (activityLogs.length < 10 || checkins.length < 10) return null;

    const correlationData = activityLogs
      .map(activity => {
        const matchingCheckin = checkins.find(c => 
          Math.abs(c.date.getTime() - activity.date.getTime()) < 24 * 60 * 60 * 1000
        );
        return matchingCheckin ? {
          steps: activity.steps || 0,
          adherence: matchingCheckin.adherencePct || 0,
        } : null;
      })
      .filter((d): d is { steps: number; adherence: number } => d !== null);

    if (correlationData.length < 5) return null;

    const activeData = correlationData.filter(d => d.steps > 8000);
    const sedentaryData = correlationData.filter(d => d.steps < 5000);

    if (activeData.length === 0 || sedentaryData.length === 0) return null;

    const avgAdherenceActive = activeData.reduce((sum, d) => sum + d.adherence, 0) / activeData.length;
    const avgAdherenceSedentary = sedentaryData.reduce((sum, d) => sum + d.adherence, 0) / sedentaryData.length;

    if (avgAdherenceActive > avgAdherenceSedentary + 15) {
      return {
        factor1: 'activity',
        factor2: 'adherence',
        correlation: 0.7,
        insight: `Los días que caminas más, tu adherencia mejora ${(avgAdherenceActive - avgAdherenceSedentary).toFixed(0)}%`,
        actionable: true,
      };
    }

    return null;
  }

  private async analyzeEmotionFoodCorrelation(userId: string): Promise<CorrelationInsight | null> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const emotionalLogs = await this.prisma.emotionalLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const mealLogs = await this.prisma.mealLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    if (emotionalLogs.length < 5 || mealLogs.length < 10) return null;

    // Analizar si días con emociones negativas correlacionan con más calorías
    const stressfulEmotions = ['ANXIETY', 'SADNESS', 'FRUSTRATION', 'ANGER'];
    
    const emotionFoodData = emotionalLogs.map(emotion => {
      const dayStart = new Date(emotion.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(emotion.date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayMeals = mealLogs.filter(meal => 
        meal.date >= dayStart && meal.date <= dayEnd
      );

      const totalKcal = dayMeals.reduce((sum, meal) => sum + meal.kcal, 0);

      return {
        isStressful: stressfulEmotions.includes(emotion.emotion),
        kcal: totalKcal,
      };
    }).filter(d => d.kcal > 0);

    if (emotionFoodData.length < 3) return null;

    const stressfulData = emotionFoodData.filter(d => d.isStressful);
    const normalData = emotionFoodData.filter(d => !d.isStressful);

    if (stressfulData.length === 0 || normalData.length === 0) return null;

    const avgKcalStressful = stressfulData.reduce((sum, d) => sum + d.kcal, 0) / stressfulData.length;
    const avgKcalNormal = normalData.reduce((sum, d) => sum + d.kcal, 0) / normalData.length;

    if (avgKcalStressful > avgKcalNormal + 300) {
      return {
        factor1: 'stress',
        factor2: 'calories',
        correlation: 0.6,
        insight: `En días estresantes consumes ${Math.round(avgKcalStressful - avgKcalNormal)} calorías extra`,
        actionable: true,
      };
    }

    return null;
  }

  async predictAbandonmentRisk(userId: string): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Factores de riesgo
    let riskScore = 0;

    // 1. Actividad reciente vs anterior
    const recentCheckins = await this.prisma.checkin.count({
      where: { userId, date: { gte: sevenDaysAgo } },
    });
    const previousCheckins = await this.prisma.checkin.count({
      where: { userId, date: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    });

    if (recentCheckins < previousCheckins * 0.5) riskScore += 30;

    // 2. Adherencia decreciente
    const recentAdherence = await this.prisma.checkin.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      select: { adherencePct: true },
    });

    const avgRecentAdherence = recentAdherence.reduce((sum, c) => sum + (c.adherencePct || 0), 0) / recentAdherence.length;
    if (avgRecentAdherence < 50) riskScore += 25;

    // 3. Falta de progreso en peso
    const recentWeights = await this.prisma.checkin.findMany({
      where: { userId, date: { gte: fourteenDaysAgo }, weightKg: { not: null } },
      orderBy: { date: 'asc' },
      select: { weightKg: true },
    });

    if (recentWeights.length >= 2) {
      const firstWeight = Number(recentWeights[0].weightKg);
      const lastWeight = Number(recentWeights[recentWeights.length - 1].weightKg);
      if (Math.abs(firstWeight - lastWeight) < 0.5) riskScore += 20;
    }

    // 4. Emociones negativas frecuentes
    const negativeEmotions = await this.prisma.emotionalLog.count({
      where: {
        userId,
        date: { gte: sevenDaysAgo },
        emotion: { in: ['SADNESS', 'FRUSTRATION', 'ANXIETY'] },
      },
    });

    if (negativeEmotions >= 3) riskScore += 15;

    // Si el riesgo es alto, enviar notificación de retención
    if (riskScore >= 60) {
      const notification: SmartNotification = {
        title: '💪 ¡No te rindas ahora!',
        body: 'Sé que ha sido difícil, pero estás más cerca de lo que crees. ¿Hablamos?',
        actions: [
          { label: 'Motivación Personal', action: 'personal_motivation' },
          { label: 'Ajustar Plan', action: 'adjust_plan' },
          { label: 'Apoyo Humano', action: 'human_support' },
        ],
        type: 'abandonment_risk',
        priority: 'high',
      };

      await this.notificationsService.createNotification(userId, notification);
    }

    return Math.min(riskScore, 100);
  }
}