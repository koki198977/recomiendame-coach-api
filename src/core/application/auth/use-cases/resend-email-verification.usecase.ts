import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RequestEmailVerificationUseCase } from './request-email-verification.usecase';
import { USER_REPOSITORY, UserRepositoryPort } from '../../users/ports/out.user-repository.port';

@Injectable()
export class ResendEmailVerificationUseCase {
  constructor(
    private readonly requestUC: RequestEmailVerificationUseCase,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(input: { email: string }) {
    // Buscar usuario por email
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new NotFoundException('No se encontró una cuenta con ese email');
    }

    // Si el email ya está verificado, no hacer nada
    if (user.emailVerified) {
      return { message: 'El email ya está verificado' };
    }

    // Reenviar verificación
    return this.requestUC.execute({
      userId: user.id,
      email: user.email,
      fullName: user.email // Puedes agregar un campo fullName al modelo User si lo necesitas
    });
  }
}
