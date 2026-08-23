import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async createNotification(data: { userId: string; type: string; title: string; body: string; channel?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundException('User not found.');
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        channel: data.channel || 'IN_APP',
      },
    });

    // Fire-and-forget external dispatch for non-IN_APP channels. Never blocks
    // or fails the calling request — the in-app record is always the source
    // of truth even if the external send doesn't happen yet.
    if (data.channel && data.channel !== 'IN_APP') {
      this.dispatchExternal(data.channel, user.mobile, user.email, data.title, data.body).catch(() => {});
    }

    return notification;
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

  // Called by other services (e.g. LeadsService on assignment) to notify a
  // user in-app. Safe to call even if the caller doesn't care about failures.
  async notify(userId: string, type: string, title: string, body: string) {
    try {
      await this.createNotification({ userId, type, title, body, channel: 'IN_APP' });
    } catch (e) {
      this.logger.warn(`Failed to notify user ${userId}: ${e}`);
    }
  }

  // ---- External gateway dispatch (SMS / WhatsApp / Email) ----
  // Dev-mode placeholder: no gateway is wired up yet. Once API keys are
  // added as environment variables (SMS_GATEWAY_API_KEY, WHATSAPP_API_KEY,
  // EMAIL_SMTP_HOST/PORT/USER/PASS), fill in the real HTTP calls below —
  // the calling code in createNotification() does not need to change.
  private async dispatchExternal(channel: string, mobile: string, email: string | null, title: string, body: string) {
    if (channel === 'SMS') {
      if (!process.env.SMS_GATEWAY_API_KEY) {
        this.logger.debug(`[dev-mode] SMS not sent (no gateway configured) — would send to ${mobile}: ${title}`);
        return;
      }
      // TODO: call SMS gateway (e.g. MSG91/Twilio) here using process.env.SMS_GATEWAY_API_KEY
      return;
    }
    if (channel === 'WHATSAPP') {
      if (!process.env.WHATSAPP_API_KEY) {
        this.logger.debug(`[dev-mode] WhatsApp not sent (no gateway configured) — would send to ${mobile}: ${title}`);
        return;
      }
      // TODO: call WhatsApp Business API here using process.env.WHATSAPP_API_KEY
      return;
    }
    if (channel === 'EMAIL') {
      if (!process.env.EMAIL_SMTP_HOST || !email) {
        this.logger.debug(`[dev-mode] Email not sent (no SMTP configured or no email on file) — would send to ${email}: ${title}`);
        return;
      }
      // TODO: send via SMTP/SES/SendGrid here using process.env.EMAIL_SMTP_*
      return;
    }
  }
}
