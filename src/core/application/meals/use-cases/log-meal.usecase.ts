import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { LogMealDto } from '../dto/log-meal.dto';

@Injectable()
export class LogMealUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, dto: LogMealDto) {
    // Importar utilidades de fecha de Chile
    const { getChileDayStart } = await import('../../../domain/common/chile-date.util');
    
    // Manejar la fecha correctamente usando la zona horaria de Chile
    let mealDate: Date;
    
    if (dto.date) {
      // Usar la utilidad de Chile para obtener el inicio del día
      // Esto asegura que la fecha se guarde en el rango correcto para Chile
      mealDate = getChileDayStart(dto.date);
    } else {
      mealDate = new Date();
    }
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Validar que no sea fecha futura
    if (mealDate > today) {
      throw new BadRequestException('No se pueden registrar comidas futuras');
    }

    console.log('📝 Registrando comida:', {
      userId,
      title: dto.title,
      slot: dto.slot,
      dateInput: dto.date,
      mealDate: mealDate.toISOString(),
      mealDateLocal: mealDate.toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
    });

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

    console.log('✅ Comida guardada:', {
      id: mealLog.id,
      date: mealLog.date.toISOString(),
      dateLocal: mealLog.date.toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
    });

    return {
      id: mealLog.id,
      message: 'Comida registrada exitosamente',
    };
  }
}
