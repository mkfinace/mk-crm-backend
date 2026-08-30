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

  @ApiPropertyOptional({ example: 'user-id-here' })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({ example: 650000 })
  @IsNumber()
  @IsOptional()
  exShowroomPrice?: number;

  @ApiPropertyOptional({ example: 45000 })
  @IsNumber()
  @IsOptional()
  rto?: number;

  @ApiPropertyOptional({ example: 25000 })
  @IsNumber()
  @IsOptional()
  insurance?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsNumber()
  @IsOptional()
  accessories?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsNumber()
  @IsOptional()
  otherCharges?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsNumber()
  @IsOptional()
  exchangeBonus?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  dealerOffer?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsNumber()
  @IsOptional()
  manufacturerOffer?: number;

  @ApiPropertyOptional({ example: 8000 })
  @IsNumber()
  @IsOptional()
  tcs?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsNumber()
  @IsOptional()
  extraWarranty?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  fastag?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsNumber()
  @IsOptional()
  crtmCharges?: number;
}
