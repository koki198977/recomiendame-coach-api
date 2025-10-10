import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { LoginUseCase } from '../../core/application/auth/use-cases/login.usecase';
import { LoginDto } from '../../core/application/auth/dto/login.dto';
import { RequestResetPasswordUseCase } from 'src/core/application/auth/use-cases/request-reset-password.usecase';
import { RequestResetDto } from 'src/core/application/auth/dto/request-reset.dto';
import { ResetPasswordUseCase } from 'src/core/application/auth/use-cases/reset-password.usecase';
import { ResetPasswordDto } from 'src/core/application/auth/dto/reset-password.dto';

@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AuthController {
  constructor(
    private readonly loginUC: LoginUseCase,
    private readonly requestResetUC: RequestResetPasswordUseCase,
    private readonly resetPasswordUC: ResetPasswordUseCase,
) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.loginUC.execute(dto);
  }

  @Post('request-reset')
  requestReset(@Body() dto: RequestResetDto) {
    return this.requestResetUC.execute(dto);
  }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUC.execute(dto);
  }
}
