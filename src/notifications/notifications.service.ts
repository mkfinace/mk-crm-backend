import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: { userId: string; type: string; title: string; body: string; channel?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        channel: data.channel || 'IN_APP',
      },
    });
  }

  listNotifications(userId: string, unreadOnly?: boolean) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found.');
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }
}
