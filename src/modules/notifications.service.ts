import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { PushNotificationsService } from './push-notifications.service';

export interface NotificationAction {
  label: string;
  action: string;
  data?: any;
}

export interface SmartNotification {
  title: string;
  body: string;
  actions: NotificationAction[];
  type: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private pushNotifications: PushNotificationsService,
  ) {}

  async createNotification(
    userId: string,
    notification: SmartNotification,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId,
        title: notification.title,
        body: notification.body,
        // Guardamos las acciones y metadata en un campo JSON si lo necesitas
        // metadata: { actions: notification.actions, type: notification.type, ...notification.metadata }
      },
    });

    // Aquí podrías integrar push notifications
    await this.sendPushNotification(userId, notification);
  }

  async getUserNotifications(userId: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  private async sendPushNotification(
    userId: string,
    notification: SmartNotification,
  ): Promise<void> {
    // Enviar push notification real
    await this.pushNotifications.sendToUser(userId, {
      title: notification.title,
      body: notification.body,
      data: {
        type: notification.type,
        priority: notification.priority,
        actions: JSON.stringify(notification.actions),
        metadata: notification.metadata ? JSON.stringify(notification.metadata) : undefined,
      },
      sound: 'default',
      badge: 1,
    });
  }
}