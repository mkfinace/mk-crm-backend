import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './notifications.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

// Was previously JwtAuthGuard-only (any authenticated user, any role) —
// tightened to staff-only as part of the permissions migration. Notifications
// are staff (User) scoped only — customers have no notification records.
@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('notifications.manage')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  createNotification(@Body() data: CreateNotificationDto) {
    return this.notificationsService.createNotification(data);
  }

  @Get()
  listNotifications(@Query('userId') userId: string, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.listNotifications(userId, unreadOnly === 'true');
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
