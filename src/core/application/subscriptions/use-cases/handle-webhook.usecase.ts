import { Injectable, Inject, Logger } from '@nestjs/common';
import { IPaymentPort, PAYMENT_PORT } from '../ports/out.payment.port';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class HandleWebhookUseCase {
  private readonly logger = new Logger(HandleWebhookUseCase.name);

  constructor(
    @Inject(PAYMENT_PORT) private readonly paymentPort: IPaymentPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(payload: Record<string, any>) {
    const event = await this.paymentPort.parseWebhookEvent(payload);

    this.logger.log(`Webhook recibido: type=${event.type}, resourceId=${event.resourceId}, payload=${JSON.stringify(payload)}`);

    // Manejar pagos de suscripción aprobados (subscription_authorized_payment)
    if (event.type === 'subscription_authorized_payment') {
      await this.handleAuthorizedPayment(event.resourceId, payload);
      return;
    }

    // MercadoPago envía type = 'subscription_preapproval'
    if (event.type !== 'subscription_preapproval') {
      this.logger.log(`Webhook ignorado: type=${event.type}`);
      return;
    }

    // Obtener estado actual de la suscripción desde MP
    const sub = await this.paymentPort.getSubscription(event.resourceId);
    let userId = sub.externalReference;

    // Fallback: buscar usuario por mpPayerId guardado previamente
    if (!userId && sub.payerId) {
      this.logger.warn(`Sin externalReference, buscando por mpPayerId=${sub.payerId}`);
      const user = await this.prisma.user.findUnique({
        where: { mpPayerId: sub.payerId },
        select: { id: true },
      });
      if (user) userId = user.id;
    }

    // Fallback: buscar por email del pagador
    if (!userId && sub.payerEmail) {
      const user = await this.prisma.user.findUnique({ where: { email: sub.payerEmail }, select: { id: true } });
      if (user) userId = user.id;
    }

    if (!userId) {
      this.logger.warn(`Webhook sin externalReference: id=${event.resourceId}`);
      return;
    }

    switch (sub.status) {
      case 'authorized': {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'PRO',
            stripeSubscriptionId: sub.id,
            trialStartedAt: new Date(),
            planExpiresAt: sub.nextPaymentDate,
            mpPayerId: sub.payerId || undefined,
          },
        });
        await this.prisma.payment.create({
          data: {
            userId,
            provider: 'mercadopago',
            preapprovalId: sub.id,
            amount: 0, // monto real viene en authorized_payment
            currency: 'CLP',
            planType: 'unknown',
            status: 'approved',
          },
        });
        this.logger.log(`Plan PRO activado para userId=${userId}`);
        break;
      }

      case 'paused':
      case 'cancelled': {
        // Suscripción cancelada — degradar a FREE
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            plan: 'FREE',
            stripeSubscriptionId: null,
          },
        });
        this.logger.log(`Plan degradado a FREE para userId=${userId}, status=${sub.status}`);
        break;
      }

      case 'pending': {
        // Pago pendiente — no cambiar plan todavía
        this.logger.log(`Suscripción pendiente para userId=${userId}`);
        break;
      }

      default:
        this.logger.warn(`Estado de suscripción desconocido: ${sub.status}`);
    }
  }

  /**
   * Maneja subscription_authorized_payment: un pago dentro de una suscripción fue aprobado.
   * MP envía el preapproval_id en el payload para identificar la suscripción.
   */
  private async handleAuthorizedPayment(
    invoiceId: string,
    payload: Record<string, any>,
  ) {
    // El preapproval_id viene en el payload del authorized_payment
    const preapprovalId =
      payload.data?.preapproval_id ??
      payload.preapproval_id ??
      payload.data?.id;

    if (!preapprovalId) {
      this.logger.warn(`subscription_authorized_payment sin preapproval_id, invoiceId=${invoiceId}`);
      return;
    }

    const sub = await this.paymentPort.getSubscription(preapprovalId);
    this.logger.log(`authorized_payment: preapprovalId=${preapprovalId}, status=${sub.status}, externalRef=${sub.externalReference}`);

    let userId = sub.externalReference;

    if (!userId && sub.payerEmail) {
      const user = await this.prisma.user.findUnique({ where: { email: sub.payerEmail }, select: { id: true } });
      if (user) userId = user.id;
    }

    if (!userId) {
      this.logger.warn(`authorized_payment sin userId identificable, preapprovalId=${preapprovalId}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'PRO',
        stripeSubscriptionId: sub.id,
        planExpiresAt: sub.nextPaymentDate,
        mpPayerId: sub.payerId || undefined,
      },
    });

    // El monto real viene en el payload del authorized_payment
    const amount = payload.data?.transaction_amount ?? payload.transaction_amount ?? 0;
    await this.prisma.payment.create({
      data: {
        userId,
        provider: 'mercadopago',
        providerPaymentId: invoiceId,
        preapprovalId,
        amount: Math.round(Number(amount)),
        currency: 'CLP',
        planType: 'unknown',
        status: 'approved',
      },
    });
    this.logger.log(`Plan PRO activado via authorized_payment para userId=${userId}`);
  }
}
