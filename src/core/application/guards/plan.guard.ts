import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLAN_KEY } from './plan.decorator';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlan = this.reflector.getAllAndOverride<string>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (user.plan === requiredPlan || user.plan === 'PRO') {
      return true;
    }

    throw new ForbiddenException({
      code: 'PLAN_UPGRADE_REQUIRED',
      message: 'Se requiere plan PRO para acceder a este recurso',
    });
  }
}
