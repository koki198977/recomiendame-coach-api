export interface IUsageLogPort {
  getCount(userId: string, feature: string, from: Date, to: Date): Promise<number>;
  increment(userId: string, feature: string): Promise<void>;
}

export const USAGE_LOG_PORT = Symbol('USAGE_LOG_PORT');
