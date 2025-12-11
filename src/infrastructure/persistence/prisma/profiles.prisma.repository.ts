import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProfilesPrismaRepository {
  constructor(private prisma: PrismaService) {}

  async getBasics(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        sex: true, birthDate: true, heightCm: true, weightKg: true, activityLevel: true,
      }
    });

    // último objetivo activo (si tienes varios) – ajusta a tu modelo
    const goal = await this.prisma.goal.findFirst({
      where: { userId },
      orderBy: { startDate: 'desc' },
      select: { goalType: true }
    });

    return { profile, goal };
  }

  async get(userId: string): Promise<any> {
    const p = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        goals: {
          where: { endDate: null },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        allergies: { include: { allergy: true } },
        conditions: { include: { condition: true } },
        cuisinePrefs: { include: { cuisine: true } },
      },
    });

    // Plain shape esperado por el controlador
    return {
      userId: p?.id ?? userId,
      sex: p?.profile?.sex ?? 'UNSPECIFIED',
      birthDate: p?.profile?.birthDate ?? null,
      heightCm: p?.profile?.heightCm ?? null,
      weightKg: p?.profile?.weightKg ?? null,
      activityLevel: p?.profile?.activityLevel ?? 'SEDENTARY',
      country: p?.profile?.country ?? null,
      budgetLevel: p?.profile?.budgetLevel ?? null,
      cookTimePerMeal: p?.profile?.cookTimePerMeal ?? null,
      goal: p?.goals?.[0]
        ? { goalType: p.goals[0].goalType }
        : null,
      allergies: (p?.allergies ?? []).map(a => ({ id: a.allergyId, name: a.allergy.name })),
      conditions: (p?.conditions ?? []).map(c => ({ id: c.conditionId, code: c.condition.code, label: c.condition.label })),
      cuisinesLike: (p?.cuisinePrefs ?? []).filter(x => x.kind === 'LIKE').map(x => ({ id: x.cuisineId, name: x.cuisine.name })),
      cuisinesDislike: (p?.cuisinePrefs ?? []).filter(x => x.kind === 'DISLIKE').map(x => ({ id: x.cuisineId, name: x.cuisine.name })),
      
      // Nuevos campos
      nutritionGoal: p?.profile?.nutritionGoal ?? null,
      targetWeightKg: p?.profile?.targetWeightKg ?? null,
      timeFrame: this.mapTimeFrameFromDb(p?.profile?.timeFrame?.toString()) ?? null,
      intensity: p?.profile?.intensity ?? null,
      currentMotivation: p?.profile?.currentMotivation ?? null,
    };
  }

  private mapTimeFrameToDb(timeFrame?: string): string | undefined {
    if (!timeFrame) return undefined;
    const mapping: Record<string, string> = {
      '1_MONTH': 'ONE_MONTH',
      '3_MONTHS': 'THREE_MONTHS',
      '6_MONTHS': 'SIX_MONTHS',
      '1_YEAR': 'ONE_YEAR',
      'LONG_TERM': 'LONG_TERM'
    };
    return mapping[timeFrame] || timeFrame;
  }

  private mapTimeFrameFromDb(timeFrame?: string): string | null {
    if (!timeFrame) return null;
    const mapping: Record<string, string> = {
      'ONE_MONTH': '1_MONTH',
      'THREE_MONTHS': '3_MONTHS',
      'SIX_MONTHS': '6_MONTHS',
      'ONE_YEAR': '1_YEAR',
      'LONG_TERM': 'LONG_TERM'
    };
    return mapping[timeFrame] || timeFrame;
  }

  async update(userId: string, patch: {
    sex?: string; birthDate?: string; heightCm?: number; weightKg?: number;
    activityLevel?: string; country?: string; budgetLevel?: number; cookTimePerMeal?: number;
    nutritionGoal?: string; targetWeightKg?: number; timeFrame?: string; intensity?: string; currentMotivation?: string;
  }): Promise<void> {
    
    // 🔍 DEBUG: Ver qué datos llegan
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('userId:', userId);
    console.log('patch recibido:', JSON.stringify(patch, null, 2));
    console.log('nutritionGoal:', patch.nutritionGoal);
    console.log('targetWeightKg:', patch.targetWeightKg);
    console.log('timeFrame:', patch.timeFrame);
    console.log('intensity:', patch.intensity);
    console.log('currentMotivation:', patch.currentMotivation);
    console.log('timeFrame mapeado:', this.mapTimeFrameToDb(patch.timeFrame));
    console.log('=============================');

    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        sex: patch.sex as any,
        birthDate: patch.birthDate ? new Date(patch.birthDate) : undefined,
        heightCm: patch.heightCm,
        weightKg: patch.weightKg as any,
        activityLevel: patch.activityLevel as any,
        country: patch.country,
        budgetLevel: patch.budgetLevel,
        cookTimePerMeal: patch.cookTimePerMeal,
        nutritionGoal: patch.nutritionGoal as any,
        targetWeightKg: patch.targetWeightKg as any,
        timeFrame: this.mapTimeFrameToDb(patch.timeFrame) as any,
        intensity: patch.intensity as any,
        currentMotivation: patch.currentMotivation,
      },
      create: {
        userId,
        sex: patch.sex as any,
        birthDate: patch.birthDate ? new Date(patch.birthDate) : null,
        heightCm: patch.heightCm ?? null,
        weightKg: (patch.weightKg as any) ?? null,
        activityLevel: patch.activityLevel as any,
        country: patch.country ?? null,
        budgetLevel: patch.budgetLevel ?? null,
        cookTimePerMeal: patch.cookTimePerMeal ?? null,
        nutritionGoal: patch.nutritionGoal as any ?? null,
        targetWeightKg: (patch.targetWeightKg as any) ?? null,
        timeFrame: this.mapTimeFrameToDb(patch.timeFrame) as any ?? null,
        intensity: patch.intensity as any ?? null,
        currentMotivation: patch.currentMotivation ?? null,
      },
    });
  }

  async replaceAllergies(userId: string, allergyIds: number[]): Promise<void> {
    await this.prisma.$transaction(async tx => {
      await tx.userAllergy.deleteMany({ where: { userId } });
      if (allergyIds.length) {
        await tx.userAllergy.createMany({
          data: allergyIds.map(id => ({ userId, allergyId: id })),
          skipDuplicates: true,
        });
      }
    });
  }

  async replaceConditions(userId: string, conditionIds: number[]): Promise<void> {
    await this.prisma.$transaction(async tx => {
      await tx.userCondition.deleteMany({ where: { userId } });
      if (conditionIds.length) {
        await tx.userCondition.createMany({
          data: conditionIds.map(id => ({ userId, conditionId: id })),
          skipDuplicates: true,
        });
      }
    });
  }

  async replaceCuisinePrefs(userId: string, likeIds: number[], dislikeIds: number[]): Promise<void> {
    await this.prisma.$transaction(async tx => {
      await tx.userCuisinePreference.deleteMany({ where: { userId } });
      if (likeIds.length) {
        await tx.userCuisinePreference.createMany({
          data: likeIds.map(id => ({ userId, cuisineId: id, kind: 'LIKE' })),
          skipDuplicates: true,
        });
      }
      if (dislikeIds.length) {
        await tx.userCuisinePreference.createMany({
          data: dislikeIds.map(id => ({ userId, cuisineId: id, kind: 'DISLIKE' })),
          skipDuplicates: true,
        });
      }
    });
  }
}
