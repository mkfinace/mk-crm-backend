import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, ReuploadDocumentDto, VerifyDocumentDto } from './documents.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/permissions.decorator';

@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @RequirePermission('documents.manage')
  @Post()
  createDocument(@Body() data: CreateDocumentDto) {
    return this.documentsService.createDocument(data);
  }

  @RequirePermission('documents.view')
  @Get()
  listDocuments(@Query('leadId') leadId?: string) {
    return this.documentsService.listDocuments(leadId);
  }

  @RequirePermission('documents.manage')
  @Put(':id/verify')
  verifyDocument(@Param('id') id: string, @Body() data: VerifyDocumentDto) {
    return this.documentsService.verifyDocument(id, data.status, data.verifiedBy, data.rejectionReason);
  }

  @RequirePermission('documents.manage')
  @Put(':id/reupload')
  reuploadDocument(@Param('id') id: string, @Body() data: ReuploadDocumentDto) {
    return this.documentsService.reuploadDocument(id, data.fileUrl, data.uploadedBy);
  }

  @RequirePermission('documents.manage')
  @Delete(':id')
  deleteDocument(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.deleteDocument(id, req.user.sub);
  }
}
