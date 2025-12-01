import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

@Injectable()
export class MarkMealConsumedUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, mealId: string, date?: string) {
    // Verificar que la comida existe y pertenece al usuario
    const meal = await this.prisma.meal.findFirst({
      where: {
        id: mealId,
        planDay: {
          plan: {
            userId,
          },
        },
      },
      include: {
        ingredients: true,
      },
    });

    if (!meal) {
      throw new NotFoundException('Comida no encontrada o no pertenece al usuario');
    }

    // Crear log de consumo
    const mealLog = await this.prisma.mealLog.create({
      data: {
        userId,
        mealId: meal.id,
        date: date ? new Date(date) : new Date(),
        slot: meal.slot,
        title: meal.title,
        kcal: meal.kcal,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
      },
    });

    return {
      id: mealLog.id,
      message: 'Comida marcada como consumida',
    };
  }
}
