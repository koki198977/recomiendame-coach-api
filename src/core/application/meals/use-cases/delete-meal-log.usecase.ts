import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class DeleteMealLogUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, mealLogId: string) {
    // Verificar que el log existe y pertenece al usuario
    const mealLog = await this.prisma.mealLog.findUnique({
      where: {
        id: mealLogId,
      },
    });

    if (!mealLog) {
      throw new NotFoundException('Registro de comida no encontrado');
    }

    if (mealLog.userId !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este registro');
    }

    // Eliminar el registro
    await this.prisma.mealLog.delete({
      where: {
        id: mealLogId,
      },
    });

    return {
      message: 'Registro de comida eliminado exitosamente',
      deletedId: mealLogId,
    };
  }
}