import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, ReuploadDocumentDto, VerifyDocumentDto } from './documents.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { STAFF_ROLES } from '../auth/role-groups';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  createDocument(@Body() data: CreateDocumentDto) {
    return this.documentsService.createDocument(data);
  }

  @Get()
  listDocuments(@Query('leadId') leadId?: string) {
    return this.documentsService.listDocuments(leadId);
  }

  @Put(':id/verify')
  verifyDocument(@Param('id') id: string, @Body() data: VerifyDocumentDto) {
    return this.documentsService.verifyDocument(id, data.status, data.verifiedBy, data.rejectionReason);
  }

  @Put(':id/reupload')
  reuploadDocument(@Param('id') id: string, @Body() data: ReuploadDocumentDto) {
    return this.documentsService.reuploadDocument(id, data.fileUrl, data.uploadedBy);
  }

  @Delete(':id')
  deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }
}
