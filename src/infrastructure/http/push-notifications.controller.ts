import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PushNotificationsService } from '../../modules/push-notifications.service';
import { IsString, IsIn } from 'class-validator';

class RegisterPushTokenDto {
  @IsString()
  pushToken: string;

  @IsString()
  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}

class UnregisterPushTokenDto {
  @IsString()
  pushToken: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  private readonly logger = new Logger(PushNotificationsController.name);

  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Post('push-token')
  @HttpCode(HttpStatus.OK)
  async registerPushToken(
    @Request() req: any,
    @Body() dto: RegisterPushTokenDto,
  ) {
    const userId = req.user.id;
    
    this.logger.log(`Registrando push token para usuario ${userId}: ${dto.platform}`);
    
    await this.pushNotificationsService.registerPushToken(
      userId,
      dto.pushToken,
      dto.platform,
    );

    return {
      success: true,
      message: 'Push token registrado exitosamente',
    };
  }

  @Delete('push-token')
  @HttpCode(HttpStatus.OK)
  async unregisterPushToken(
    @Request() req: any,
    @Body() dto: UnregisterPushTokenDto,
  ) {
    const userId = req.user.id;
    
    this.logger.log(`Eliminando push token para usuario ${userId}`);
    
    await this.pushNotificationsService.unregisterPushToken(
      dto.pushToken,
      userId,
    );

    return {
      success: true,
      message: 'Push token eliminado exitosamente',
    };
  }
}