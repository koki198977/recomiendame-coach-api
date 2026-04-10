export interface CreateCheckoutInput {
  priceId: string;
  userId: string;
  stripeCustomerId?: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays: number;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: Record<string, any>;
  };
}

export interface StripeSubscriptionData {
  id: string;
  status: string;
  currentPeriodEnd: number;
  customerId: string;
}

export interface IStripePort {
  createCheckoutSession(input: CreateCheckoutInput): Promise<{ url: string; sessionId: string }>;
  constructWebhookEvent(payload: Buffer, signature: string): Promise<StripeWebhookEvent>;
  retrieveSubscription(subscriptionId: string): Promise<StripeSubscriptionData>;
}

export const STRIPE_PORT = Symbol('STRIPE_PORT');
