import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: 'Aadhaar', description: 'e.g. Aadhaar, PAN, Address Proof, Income Proof, Bank Statement, ITR, GST' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'https://storage.example.com/docs/aadhaar123.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ example: 'user-id-here', description: 'Who uploaded this document' })
  @IsString()
  @IsNotEmpty()
  uploadedBy: string;
}

export class VerifyDocumentDto {
  @ApiProperty({ example: 'VERIFIED', description: 'VERIFIED or REJECTED' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'user-id-here', description: 'Who verified/rejected this document' })
  @IsString()
  @IsNotEmpty()
  verifiedBy: string;

  @ApiPropertyOptional({ example: 'Photo is blurry, please re-upload' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class ReuploadDocumentDto {
  @ApiProperty({ example: 'https://storage.example.com/docs/aadhaar123-v2.pdf' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  uploadedBy: string;
}
