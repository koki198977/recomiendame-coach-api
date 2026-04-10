import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CreateCheckoutInput,
  IStripePort,
  StripeSubscriptionData,
  StripeWebhookEvent,
} from '../../core/application/subscriptions/ports/out.stripe.port';

@Injectable()
export class StripeAdapter implements IStripePort {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(configService.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2026-03-25.dahlia',
    });
    this.webhookSecret = configService.get<string>('STRIPE_WEBHOOK_SECRET')!;
  }

  async createCheckoutSession(
    input: CreateCheckoutInput,
  ): Promise<{ url: string; sessionId: string }> {
    let customerId = input.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: input.customerEmail,
        metadata: { userId: input.userId },
      });
      customerId = customer.id;
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: input.priceId, quantity: 1 }],
      subscription_data: { trial_period_days: input.trialPeriodDays },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });

    return { url: session.url!, sessionId: session.id };
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<StripeWebhookEvent> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
      return event as unknown as StripeWebhookEvent;
    } catch {
      throw new BadRequestException('Firma de webhook inválida');
    }
  }

  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<StripeSubscriptionData> {
    const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
    const subAny = sub as any;
    return {
      id: sub.id,
      status: sub.status,
      currentPeriodEnd: subAny.current_period_end ?? 0,
      customerId: sub.customer as string,
    };
  }
}
