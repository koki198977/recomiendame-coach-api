import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class GetMealsTodayUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, date?: string) {
    // Importar las utilidades de fecha de Chile
    const { getChileDateString, getChileDayStart, getChileDayEnd } = await import('../../../domain/common/chile-date.util');
    
    const dateString = date || getChileDateString();
    const startOfDay = getChileDayStart(dateString);
    const endOfDay = getChileDayEnd(dateString);

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
      date: dateString,
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
