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
    // Debug logging
    this.logger.debug(`Request user object: ${JSON.stringify(req.user)}`);
    
    const userId = req.user.userId;
    
    if (!userId) {
      this.logger.error('UserId is undefined from JWT payload');
      throw new Error('Usuario no autenticado correctamente');
    }
    
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
    const userId = req.user.userId; // Cambiar de id a userId
    
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