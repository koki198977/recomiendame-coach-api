import { Injectable, Inject } from '@nestjs/common';
import { IPaymentPort, PAYMENT_PORT } from '../ports/out.payment.port';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    @Inject(PAYMENT_PORT) private readonly paymentPort: IPaymentPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute({ userId, planId, planType }: { userId: string; planId: string; planType?: 'monthly' | 'annual' }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new Error(`Usuario no encontrado: ${userId}`);
    }

    const result = await this.paymentPort.createSubscriptionLink({
      planId,
      planType,
      userId,
      customerEmail: user.email,
      successUrl: 'recomiendame://payment-success',
      cancelUrl: 'recomiendame://payment-cancel',
      trialDays: 3,
      externalReference: userId,
    });

    return { checkoutUrl: result.url };
  }
}
