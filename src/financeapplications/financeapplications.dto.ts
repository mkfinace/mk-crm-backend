import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export const FINANCE_APPLICATION_STATUSES = ['LOGIN_PENDING', 'LOGIN_DONE', 'QUERY', 'SANCTION', 'REJECTED', 'WITHDRAWN'];

export class CreateFinanceApplicationDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: 'bank-id-here' })
  @IsString()
  @IsNotEmpty()
  bankId: string;

  @ApiPropertyOptional({ example: 'HDFC-2026-88213' })
  @IsString()
  @IsOptional()
  applicationNumber?: string;

  @ApiPropertyOptional({ example: '2026-08-30T00:00:00Z' })
  @IsString()
  @IsOptional()
  loginDate?: string;

  @ApiPropertyOptional({ example: 850000 })
  @IsNumber()
  @IsOptional()
  loanAmount?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsNumber()
  @IsOptional()
  tenureMonths?: number;

  @ApiPropertyOptional({ example: 'Customer prefers this bank due to lower ROI' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateFinanceApplicationStatusDto {
  @ApiProperty({ example: 'SANCTION', enum: FINANCE_APPLICATION_STATUSES })
  @IsString()
  @IsIn(FINANCE_APPLICATION_STATUSES)
  status: string;

  @ApiPropertyOptional({ example: 'Sanctioned at 10.5% ROI' })
  @IsString()
  @IsOptional()
  notes?: string;
}
