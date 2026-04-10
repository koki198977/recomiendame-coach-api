import { Injectable, Inject, Logger } from '@nestjs/common';
import { IPaymentPort, PAYMENT_PORT } from '../ports/out.payment.port';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class ActivatePlanFromPreapprovalUseCase {
  private readonly logger = new Logger(ActivatePlanFromPreapprovalUseCase.name);

  constructor(
    @Inject(PAYMENT_PORT) private readonly paymentPort: IPaymentPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(preapprovalId: string): Promise<{ activated: boolean; status: string }> {
    const sub = await this.paymentPort.getSubscription(preapprovalId);

    this.logger.log(
      `Consultando PreApproval: id=${preapprovalId}, status=${sub.status}, externalRef=${sub.externalReference}`,
    );

    let userId = sub.externalReference;

    if (!userId && sub.payerEmail) {
      const user = await this.prisma.user.findUnique({
        where: { email: sub.payerEmail },
        select: { id: true },
      });
      if (user) userId = user.id;
    }

    if (!userId) {
      this.logger.warn(`No se pudo identificar userId para preapprovalId=${preapprovalId}`);
      return { activated: false, status: sub.status };
    }

    if (sub.status === 'authorized') {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          plan: 'PRO',
          stripeSubscriptionId: sub.id,
          planExpiresAt: sub.nextPaymentDate,
          mpPayerId: sub.payerId || undefined,
        },
      });
      await this.prisma.payment.upsert({
        where: { providerPaymentId: sub.id },
        create: {
          userId,
          provider: 'mercadopago',
          providerPaymentId: sub.id,
          preapprovalId: sub.id,
          amount: 0,
          currency: 'CLP',
          planType: 'unknown',
          status: 'approved',
        },
        update: { status: 'approved' },
      });
      this.logger.log(`Plan PRO activado via payment-return para userId=${userId}`);
      return { activated: true, status: sub.status };
    }

    this.logger.log(`PreApproval status=${sub.status}, no se activa plan para userId=${userId}`);
    return { activated: false, status: sub.status };
  }
}
