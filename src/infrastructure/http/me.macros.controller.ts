import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MacrosService } from '../../core/application/plans/services/macros.service';
import { ProfilesPrismaRepository } from '../persistence/prisma/profiles.prisma.repository';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeMacrosController {
  constructor(
    private readonly macros: MacrosService,
    private readonly profiles: ProfilesPrismaRepository,
  ) {}

  @Get('macros')
  async preview(@Req() req: any, @Query('week') week?: string) {
    const userId = req.user.userId ?? req.user.sub;

    const { profile, goal } = await this.profiles.getBasics(userId);
    const out = this.macros.compute(
      {
        sex: profile?.sex ?? undefined,
        birthDate: profile?.birthDate ?? undefined,
        heightCm: profile?.heightCm ?? undefined,
        weightKg: profile?.weightKg ? Number(profile.weightKg) : undefined,
        activityLevel: profile?.activityLevel ?? undefined,
      },
      { goalType: goal?.goalType ?? undefined }
    );

    return { week: week ?? null, ...out };
  }
}
