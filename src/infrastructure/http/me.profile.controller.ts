import { Body, Controller, Get, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetMyProfileUseCase } from '../../core/application/profile/use-cases/get-my-profile.usecase';
import { UpdateMyProfileUseCase } from '../../core/application/profile/use-cases/update-my-profile.usecase';
import { UpdateMyPreferencesUseCase } from '../../core/application/profile/use-cases/update-my-preferences.usecase';
import { UpdateProfileDto } from '../../core/application/profile/dto/update-profile.dto';
import { UpdatePreferencesDto } from '../../core/application/profile/dto/update-preferences.dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MeProfileController {
  constructor(
    private readonly getUC: GetMyProfileUseCase,
    private readonly updateUC: UpdateMyProfileUseCase,
    private readonly prefsUC: UpdateMyPreferencesUseCase,
  ) {}

  @Get('profile')
  get(@Req() req: any) { return this.getUC.execute(req.user.userId ?? req.user.sub); }

  @Post('profile')
  update(@Body() dto: UpdateProfileDto, @Req() req: any) {
    return this.updateUC.execute(req.user.userId ?? req.user.sub, dto);
  }

  @Post('preferences')
  updatePrefs(@Body() dto: UpdatePreferencesDto, @Req() req: any) {
    return this.prefsUC.execute(req.user.userId ?? req.user.sub, dto);
  }
}
