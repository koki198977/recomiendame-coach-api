import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { LogMealDto } from '../dto/log-meal.dto';

@Injectable()
export class LogMealUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, dto: LogMealDto) {
    const mealDate = dto.date ? new Date(dto.date) : new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día de hoy

    // Validar que no sea fecha futura
    if (mealDate > today) {
      throw new BadRequestException('No se pueden registrar comidas futuras');
    }

    const mealLog = await this.prisma.mealLog.create({
      data: {
        userId,
        mealId: dto.mealId,
        date: mealDate,
        slot: dto.slot,
        title: dto.title,
        kcal: dto.kcal,
        protein_g: dto.protein_g,
        carbs_g: dto.carbs_g,
        fat_g: dto.fat_g,
        notes: dto.notes,
        imageUrl: dto.imageUrl,
      },
    });

    return {
      id: mealLog.id,
      message: 'Comida registrada exitosamente',
    };
  }
}
