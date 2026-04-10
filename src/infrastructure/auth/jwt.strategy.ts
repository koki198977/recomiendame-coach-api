import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { plan: true, planExpiresAt: true },
    });

    // Si el plan expiró, lo tratamos como FREE en runtime (sin tocar la DB aquí)
    const now = new Date();
    const effectivePlan =
      user?.plan === 'PRO' && user.planExpiresAt && user.planExpiresAt < now
        ? 'FREE'
        : (user?.plan ?? 'FREE');

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      emailVerified: payload.emailVerified,
      plan: effectivePlan,
      planExpiresAt: user?.planExpiresAt ?? null,
    };
  }
}
