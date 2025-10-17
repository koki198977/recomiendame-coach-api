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
      sex: p?.profile?.sex ?? 'UNSPECIFIED',
      birthDate: p?.profile?.birthDate ?? null,
      heightCm: p?.profile?.heightCm ?? null,
      weightKg: p?.profile?.weightKg ?? null,
      activityLevel: p?.profile?.activityLevel ?? 'SEDENTARY',
      goal: p?.goals?.[0]
        ? { goalType: p.goals[0].goalType }
        : null,
      allergies: (p?.allergies ?? []).map(a => ({ id: a.allergyId, name: a.allergy.name })),
      conditions: (p?.conditions ?? []).map(c => ({ id: c.conditionId, code: c.condition.code, label: c.condition.label })),
      cuisinesLike: (p?.cuisinePrefs ?? []).filter(x => x.kind === 'LIKE').map(x => ({ id: x.cuisineId, name: x.cuisine.name })),
      cuisinesDislike: (p?.cuisinePrefs ?? []).filter(x => x.kind === 'DISLIKE').map(x => ({ id: x.cuisineId, name: x.cuisine.name })),
    };
  }

  async update(userId: string, patch: {
    sex?: string; birthDate?: string; heightCm?: number; weightKg?: number;
    activityLevel?: string; country?: string; budgetLevel?: number; cookTimePerMeal?: number;
  }): Promise<void> {
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
