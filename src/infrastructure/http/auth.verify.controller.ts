import { Controller, Post, Req, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestEmailVerificationUseCase } from 'src/core/application/auth/use-cases/request-email-verification.usecase';
import { ResendEmailVerificationUseCase } from 'src/core/application/auth/use-cases/resend-email-verification.usecase';
import { VerifyEmailUseCase } from 'src/core/application/auth/use-cases/verify-email.usecase';

@Controller('auth')
export class AuthVerifyController {
  constructor(
    private readonly requestUC: RequestEmailVerificationUseCase,
    private readonly resendUC: ResendEmailVerificationUseCase,
    private readonly verifyUC: VerifyEmailUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('request-email-verification')
  async request(@Req() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const email = req.user.email;
    const fullName = req.user.fullName ?? req.user.name ?? req.user.email;
    return this.requestUC.execute({ userId, email, fullName });
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-email-verification')
  async resend(@Req() req: any) {
    const userId = req.user.userId ?? req.user.sub;
    const email = req.user.email;
    const fullName = req.user.fullName ?? req.user.name ?? req.user.email;
    return this.resendUC.execute({ userId, email, fullName });
  }

  // endpoint público para el click del correo
  @Get('verify-email')
  async verify(@Query('token') token: string) {
    return this.verifyUC.execute({ token });
  }
}
