import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationTriggersService } from './notification-triggers.service';
import { SmartAnalyticsService } from './smart-analytics.service';
import { HealthAwareNotificationsService } from './health-aware-notifications.service';
import { ContextualNotificationsService } from './contextual-notifications.service';
import { PushNotificationsService } from './push-notifications.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationTriggersService,
    SmartAnalyticsService,
    HealthAwareNotificationsService,
    ContextualNotificationsService,
    PushNotificationsService,
  ],
  exports: [
    NotificationsService,
    NotificationTriggersService,
    SmartAnalyticsService,
    HealthAwareNotificationsService,
    ContextualNotificationsService,
    PushNotificationsService,
  ],
})
export class NotificationsModule {}