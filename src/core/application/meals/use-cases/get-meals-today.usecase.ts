import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetMealsTodayUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await this.prisma.mealLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        date: 'asc',
      },
      include: {
        meal: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    // Calcular totales del día
    const totals = logs.reduce(
      (acc, log) => ({
        kcal: acc.kcal + log.kcal,
        protein_g: acc.protein_g + log.protein_g,
        carbs_g: acc.carbs_g + log.carbs_g,
        fat_g: acc.fat_g + log.fat_g,
      }),
      { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    return {
      date: targetDate.toISOString().split('T')[0],
      logs: logs.map(log => ({
        id: log.id,
        mealId: log.mealId,
        slot: log.slot,
        title: log.title,
        kcal: log.kcal,
        protein_g: log.protein_g,
        carbs_g: log.carbs_g,
        fat_g: log.fat_g,
        notes: log.notes,
        imageUrl: log.imageUrl,
        date: log.date,
        fromPlan: !!log.mealId,
        ingredients: log.meal?.ingredients || [],
      })),
      totals,
    };
  }
}
