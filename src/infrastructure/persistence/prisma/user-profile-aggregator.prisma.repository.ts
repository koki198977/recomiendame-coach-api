import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserProfileAggregatorPort } from '../../../core/application/chapi-v2/ports/out.user-profile-aggregator.port';
import { UserCompleteProfile } from '../../../core/application/chapi-v2/ports/out.chapi-v2-agent.port';

@Injectable()
export class UserProfileAggregatorPrismaRepository implements UserProfileAggregatorPort {
  constructor(private prisma: PrismaService) {}

  async getCompleteUserProfile(userId: string): Promise<UserCompleteProfile> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Obtener datos del usuario con todas las relaciones
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        allergies: { include: { allergy: true } },
        conditions: { include: { condition: true } },
        cuisinePrefs: { include: { cuisine: true } },
        checkins: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: 'desc' },
          take: 30,
        },
        hydrationLogs: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: 'desc' },
          take: 30,
        },
        sleepLogs: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: 'desc' },
          take: 30,
        },
        activityLogs: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: 'desc' },
          take: 30,
        },
        mealLogs: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: 'desc' },
          take: 50,
        },
        emotionalLogs: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: 'desc' },
          take: 30,
        },
        goals: {
          orderBy: { createdAt: 'desc' },
        },
        plans: {
          where: { 
            weekStart: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
          },
          orderBy: { weekStart: 'desc' },
          take: 2,
        },
        workoutPlans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
          take: 10,
        },
        streak: true,
        points: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Calcular edad
    const age = user.profile?.birthDate 
      ? Math.floor((Date.now() - user.profile.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;

    // Analizar patrones
    const patterns = await this.analyzeUserPatterns(userId);

    // Calcular puntos totales
    const totalPoints = user.points?.reduce((sum, p) => sum + p.delta, 0) || 0;

    return {
      id: user.id,
      email: user.email,
      profile: {
        sex: user.profile?.sex || 'UNSPECIFIED',
        age,
        heightCm: user.profile?.heightCm || 0,
        weightKg: Number(user.profile?.weightKg) || 0,
        activityLevel: user.profile?.activityLevel || 'MODERATE',
        country: user.profile?.country || '',
        nutritionGoal: user.profile?.nutritionGoal || 'IMPROVE_HEALTH',
        targetWeightKg: Number(user.profile?.targetWeightKg) || 0,
        timeFrame: user.profile?.timeFrame || 'THREE_MONTHS',
        intensity: user.profile?.intensity || 'MODERATE',
        currentMotivation: user.profile?.currentMotivation || '',
      },
      allergies: user.allergies.map(a => a.allergy.name),
      conditions: user.conditions.map(c => c.condition.label),
      cuisinePreferences: user.cuisinePrefs.map(cp => ({
        cuisine: cp.cuisine.name,
        preference: cp.kind as 'LIKE' | 'DISLIKE',
      })),
      recentCheckins: user.checkins,
      recentHydration: user.hydrationLogs,
      recentSleep: user.sleepLogs,
      recentActivity: user.activityLogs,
      recentMeals: user.mealLogs,
      recentEmotions: user.emotionalLogs,
      currentGoals: user.goals,
      activePlans: user.plans,
      activeWorkouts: user.workoutPlans,
      achievements: user.achievements.map(ua => ua.achievement),
      currentStreak: user.streak,
      points: totalPoints,
      patterns: {
        sleepPattern: patterns.sleepPattern.consistency,
        activityPattern: patterns.activityPattern.consistency,
        nutritionPattern: `${patterns.nutritionPattern.averageAdherence}% adherencia`,
        emotionalPattern: patterns.emotionalPattern.dominantEmotions.join(', '),
        adherencePattern: `${patterns.adherencePattern.overallAdherence}% general`,
      },
    };
  }

  async analyzeUserPatterns(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Análisis de sueño
    const sleepLogs = await this.prisma.sleepLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
    });

    const sleepPattern = {
      averageHours: sleepLogs.length > 0 
        ? sleepLogs.reduce((sum, s) => sum + Number(s.hours), 0) / sleepLogs.length 
        : 0,
      averageQuality: sleepLogs.length > 0 
        ? sleepLogs.reduce((sum, s) => sum + (s.quality || 0), 0) / sleepLogs.length 
        : 0,
      consistency: this.calculateConsistency(sleepLogs.map(s => Number(s.hours))),
      trends: ['Análisis de tendencias pendiente'],
    };

    // Análisis de actividad
    const activityLogs = await this.prisma.activityLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
    });

    const activityPattern = {
      averageSteps: activityLogs.length > 0 
        ? activityLogs.reduce((sum, a) => sum + (a.steps || 0), 0) / activityLogs.length 
        : 0,
      averageActiveMinutes: activityLogs.length > 0 
        ? activityLogs.reduce((sum, a) => sum + (a.minutes || 0), 0) / activityLogs.length 
        : 0,
      preferredActivities: ['Caminar', 'Ejercicio en casa'], // Simplificado
      consistency: this.calculateConsistency(activityLogs.map(a => a.steps || 0)),
    };

    // Análisis nutricional
    const checkins = await this.prisma.checkin.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
    });

    const nutritionPattern = {
      averageAdherence: checkins.length > 0 
        ? Math.round(checkins.reduce((sum, c) => sum + (c.adherencePct || 0), 0) / checkins.length)
        : 0,
      preferredMeals: ['Desayuno saludable', 'Almuerzo balanceado'], // Simplificado
      macroBalance: { protein: 25, carbs: 45, fats: 30 }, // Simplificado
      eatingTimes: ['8:00', '13:00', '19:00'], // Simplificado
    };

    // Análisis emocional
    const emotionalLogs = await this.prisma.emotionalLog.findMany({
      where: { userId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
    });

    const emotionCounts: Record<string, number> = {};
    emotionalLogs.forEach(log => {
      emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1;
    });

    const dominantEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion]) => emotion);

    const emotionalPattern = {
      dominantEmotions,
      emotionalTriggers: ['Estrés laboral', 'Falta de sueño'], // Simplificado
      copingStrategies: ['Respiración profunda', 'Ejercicio'], // Simplificado
      emotionalTrends: ['Mejora gradual'], // Simplificado
    };

    // Análisis de adherencia
    const adherencePattern = {
      overallAdherence: nutritionPattern.averageAdherence,
      strongestAreas: ['Hidratación', 'Sueño'],
      challengingAreas: ['Ejercicio regular', 'Planificación de comidas'],
      motivationFactors: ['Progreso visible', 'Apoyo social'],
    };

    return {
      sleepPattern,
      activityPattern,
      nutritionPattern,
      emotionalPattern,
      adherencePattern,
    };
  }

  async generatePredictiveInsights(userId: string) {
    const patterns = await this.analyzeUserPatterns(userId);
    
    // Análisis de riesgo simplificado
    const riskFactors = {
      abandonmentRisk: patterns.adherencePattern.overallAdherence < 50 ? 'high' : 
                      patterns.adherencePattern.overallAdherence < 70 ? 'medium' : 'low',
      burnoutRisk: patterns.activityPattern.averageActiveMinutes > 120 ? 'high' : 'low',
      plateauRisk: 'medium', // Simplificado
    } as const;

    const opportunities = {
      improvementAreas: patterns.adherencePattern.challengingAreas,
      motivationOpportunities: patterns.adherencePattern.motivationFactors,
      habitFormationOpportunities: ['Rutina matutina', 'Preparación de comidas'],
    };

    const recommendations = {
      immediate: ['Completar check-in diario', 'Beber más agua'],
      shortTerm: ['Establecer rutina de ejercicio', 'Mejorar calidad del sueño'],
      longTerm: ['Desarrollar hábitos sostenibles', 'Mantener motivación a largo plazo'],
    };

    return {
      riskFactors,
      opportunities,
      recommendations,
    };
  }

  async getCurrentUserContext(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Progreso de hoy
    const todayCheckin = await this.prisma.checkin.findFirst({
      where: { userId, date: { gte: today } },
    });

    const todayHydration = await this.prisma.hydrationLog.findMany({
      where: { userId, date: { gte: today } },
    });

    const todayMeals = await this.prisma.mealLog.findMany({
      where: { userId, date: { gte: today } },
    });

    const todayWorkout = await this.prisma.workoutPlan.findFirst({
      where: { userId },
      // Simplificado: asumir que si hay plan, puede estar completado
    });

    const todaySleep = await this.prisma.sleepLog.findFirst({
      where: { userId, date: { gte: today } },
    });

    // Obtener objetivo de hidratación del usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { hydrationGoal: true },
    });

    const hydrationGoal = (user?.hydrationGoal as any)?.dailyGoalMl || 2000;
    const todayHydrationTotal = todayHydration.reduce((sum, h) => sum + h.ml, 0);

    const todayProgress = {
      checkinCompleted: !!todayCheckin,
      hydrationProgress: Math.min(1, todayHydrationTotal / hydrationGoal),
      mealsLogged: todayMeals.length,
      workoutCompleted: !!todayWorkout, // Simplificado
      sleepLogged: !!todaySleep,
    };

    // Tendencias recientes (últimos 7 días)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentCheckins = await this.prisma.checkin.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const recentTrends = {
      weightTrend: this.calculateTrend(recentCheckins.map(c => c.weightKg).filter(Boolean).map(Number)),
      adherenceTrend: this.mapTrendToAdherence(this.calculateTrend(recentCheckins.map(c => c.adherencePct || 0))),
      emotionalTrend: 'neutral' as const, // Simplificado
    };

    // Eventos próximos
    const activeGoals = await this.prisma.goal.findMany({
      where: { userId },
    });

    const activePlans = await this.prisma.plan.findMany({
      where: { userId, weekStart: { gte: today } },
      orderBy: { weekStart: 'asc' },
      take: 1,
    });

    const upcomingEvents = {
      goalDeadlines: activeGoals.filter(g => g.endDate && g.endDate > new Date()),
      planExpirations: activePlans,
      streakMilestones: [], // Simplificado
    };

    return {
      todayProgress,
      recentTrends,
      upcomingEvents,
    };
  }

  private calculateConsistency(values: number[]): 'high' | 'medium' | 'low' {
    if (values.length < 3) return 'low';
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const coefficient = Math.sqrt(variance) / mean;
    
    if (coefficient < 0.2) return 'high';
    if (coefficient < 0.4) return 'medium';
    return 'low';
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values.slice(0, Math.ceil(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = first.reduce((sum, v) => sum + v, 0) / first.length;
    const secondAvg = second.reduce((sum, v) => sum + v, 0) / second.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private mapTrendToAdherence(trend: 'increasing' | 'decreasing' | 'stable'): 'improving' | 'declining' | 'stable' {
    switch (trend) {
      case 'increasing': return 'improving';
      case 'decreasing': return 'declining';
      case 'stable': return 'stable';
    }
  }
}