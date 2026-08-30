import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVariantPriceDto {
  @IsString()
  variantId: string;

  @ApiPropertyOptional({ description: 'Set for a dealer-specific price. Leave blank for a city-level or global price.' })
  @IsOptional()
  @IsString()
  dealerId?: string;

  @ApiPropertyOptional({ description: 'Set (with dealerId blank) for a city-level price. Leave both blank for a global override.' })
  @IsOptional()
  @IsString()
  city?: string;

  @IsNumber()
  exShowroomPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rtoCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  insuranceCharges?: number;
}
