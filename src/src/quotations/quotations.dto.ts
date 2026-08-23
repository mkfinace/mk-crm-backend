import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuotationDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: 650000 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 715000 })
  @IsNumber()
  onRoadPrice: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsNumber()
  @IsOptional()
  exchangeValue?: number;

  @ApiProperty({ example: '2026-09-30T00:00:00Z' })
  @IsString()
  @IsNotEmpty()
  validTill: string;
}
