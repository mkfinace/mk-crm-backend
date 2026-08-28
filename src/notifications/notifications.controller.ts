import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './notifications.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
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
