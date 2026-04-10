import { Injectable, Inject } from '@nestjs/common';
import { IUsageLogPort, USAGE_LOG_PORT } from './ports/out.usage-log.port';
import { FeatureKey, Window } from './feature-gates';

export interface CheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resetsAt: Date;
}

export function computeWindowBounds(window: Window, now: Date): { start: Date; end: Date } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  switch (window) {
    case 'daily': {
      const start = new Date(Date.UTC(y, m, d));
      const end = new Date(Date.UTC(y, m, d + 1));
      return { start, end };
    }
    case 'weekly': {
      // ISO week: Monday = 0 offset
      const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const daysFromMonday = (dayOfWeek + 6) % 7;
      const start = new Date(Date.UTC(y, m, d - daysFromMonday));
      const end = new Date(Date.UTC(y, m, d - daysFromMonday + 7));
      return { start, end };
    }
    case 'monthly': {
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 1));
      return { start, end };
    }
  }
}

@Injectable()
export class UsageLimitService {
  constructor(
    @Inject(USAGE_LOG_PORT)
    private readonly usageLogPort: IUsageLogPort,
  ) {}

  async checkAndIncrement(
    userId: string,
    feature: FeatureKey,
    limit: number,
    window: Window,
  ): Promise<CheckResult> {
    const now = new Date();
    const { start, end } = computeWindowBounds(window, now);
    const resetsAt = end;

    const current = await this.usageLogPort.getCount(userId, feature, start, end);

    if (current >= limit) {
      return { allowed: false, current, limit, resetsAt };
    }

    await this.usageLogPort.increment(userId, feature);
    return { allowed: true, current: current + 1, limit, resetsAt };
  }
}
