import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './messages.dto';

@ApiTags('messages')
@Controller('messages')
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
