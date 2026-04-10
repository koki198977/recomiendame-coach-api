import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY, FeatureMetadata } from './plan.decorator';
import { UsageLimitService } from '../plan/usage-limit.service';

@Injectable()
export class UsageLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usageLimitService: UsageLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<FeatureMetadata>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!metadata) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (user.plan === 'PRO') {
      return true;
    }

    const result = await this.usageLimitService.checkAndIncrement(
      user.id,
      metadata.feature,
      metadata.limit,
      metadata.window,
    );

    if (!result.allowed) {
      throw new ForbiddenException({
        code: 'USAGE_LIMIT_REACHED',
        message: 'Has alcanzado el límite de uso para este feature',
        details: {
          feature: metadata.feature,
          current: result.current,
          limit: result.limit,
          resetsAt: result.resetsAt,
        },
      });
    }

    return true;
  }
}
