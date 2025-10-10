import { Injectable } from '@nestjs/common';
import { NotificationPort } from '../../core/application/plans/ports/out.notification.port';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
@Injectable()
export class InAppNotificationAdapter implements NotificationPort {
  constructor(private prisma: PrismaService) {}
  async notify(userId: string, title: string, body: string): Promise<void> {
    await this.prisma.notification.create({ data: { userId, title, body } });
  }
}
