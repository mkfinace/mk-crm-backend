import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './messages.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

// Was previously JwtAuthGuard-only (any authenticated user, any role) —
// tightened to staff-only as part of the permissions migration. Customer
// portal messages use a separate endpoint (leads.controller.ts addMyMessage
// → portal.access), so this was never meant to be customer-reachable.
@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('messages.manage')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  createMessage(@Body() data: CreateMessageDto) {
    return this.messagesService.createMessage(data);
  }

  @Get()
  listMessages(@Query('leadId') leadId: string) {
    return this.messagesService.listMessages(leadId);
  }

  @Post('read')
  markMessagesRead(@Body() data: { leadId: string }) {
    return this.messagesService.markMessagesRead(data.leadId);
  }
}
