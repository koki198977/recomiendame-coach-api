import { Inject, Injectable } from '@nestjs/common';
import { RequestEmailVerificationUseCase } from './request-email-verification.usecase';

@Injectable()
export class ResendEmailVerificationUseCase {
  constructor(private readonly requestUC: RequestEmailVerificationUseCase) {}

  async execute(input: { userId: string; email: string; fullName?: string }) {
    return this.requestUC.execute(input);
  }
}
