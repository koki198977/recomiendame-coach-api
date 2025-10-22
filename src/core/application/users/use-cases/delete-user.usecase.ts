import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class DeleteUserUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(userId: string, confirmation?: string): Promise<{ message: string }> {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificación adicional para usuarios admin
    if (user.role === 'ADMIN' && confirmation !== 'DELETE_ADMIN_ACCOUNT') {
      throw new BadRequestException('Para eliminar una cuenta de administrador, debe proporcionar la confirmación correcta');
    }

    try {
      // Eliminar el usuario en una transacción para asegurar consistencia
      await this.prisma.$transaction(async (tx) => {
        // Las relaciones con onDelete: Cascade se eliminarán automáticamente
        await tx.user.delete({
          where: { id: userId }
        });
      });

      return {
        message: `Cuenta de usuario ${user.email} eliminada exitosamente`
      };
    } catch (error) {
      throw new BadRequestException('Error al eliminar la cuenta. Inténtelo de nuevo.');
    }
  }
}