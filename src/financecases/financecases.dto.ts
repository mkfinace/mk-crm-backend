import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFinanceCaseDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: 'bank-id-here' })
  @IsString()
  @IsNotEmpty()
  bankId: string;

  @ApiProperty({ example: 'user-id-of-finance-executive' })
  @IsString()
  @IsNotEmpty()
  financeExecutiveId: string;

  @ApiProperty({ example: 550000 })
  @IsNumber()
  loanAmount: number;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  downPayment: number;

  @ApiProperty({ example: 60 })
  @IsNumber()
  tenureMonths: number;

  @ApiProperty({ example: 9.5 })
  @IsNumber()
  roi: number;

  @ApiProperty({ example: 11500 })
  @IsNumber()
  emi: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  processingFee?: number;

  @ApiPropertyOptional({ example: '{"insuranceFee": 2000}' })
  @IsString()
  @IsOptional()
  otherChargesJson?: string;
}

export class UpdateFinanceCaseStageDto {
  @ApiProperty({ example: 'DOCUMENTS', description: 'PENDING, DOCUMENTS, LOGIN, VERIFICATION, BANK_QUERY, QUERY_RESOLVED, SANCTION, AGREEMENT, DISBURSEMENT, FINANCE_COMPLETED' })
  @IsString()
  @IsNotEmpty()
  stage: string;

  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  changedBy: string;

  @ApiPropertyOptional({ example: 'All documents verified, moving to sanction' })
  @IsString()
  @IsOptional()
  notes?: string;
}
