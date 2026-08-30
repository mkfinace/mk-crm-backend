import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['FLAT', 'PERCENTAGE'])
  discountType: string;

  @IsNumber()
  discountValue: number;

  @ApiPropertyOptional({ description: 'Set for a brand-wide offer.' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Set for a model-wide offer.' })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({ description: 'Set for a single-variant offer.' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;
}

export class UpdateOfferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['FLAT', 'PERCENTAGE'] })
  @IsOptional()
  @IsIn(['FLAT', 'PERCENTAGE'])
  discountType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: string;
}
