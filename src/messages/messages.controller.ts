import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './messages.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
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
}
