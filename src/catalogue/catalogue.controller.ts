import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Maruti Suzuki' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}

export class CreateModelDto {
  @ApiProperty({ example: 'brand-id-123' })
  @IsString()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({ example: 'Swift' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateModelDto extends PartialType(CreateModelDto) {}

export class CreateVariantDto {
  @ApiProperty({ example: 'model-id-123' })
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @ApiProperty({ example: 'VXI' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Petrol' })
  @IsString()
  @IsNotEmpty()
  fuelType: string;

  @ApiProperty({ example: 'Manual' })
  @IsString()
  @IsNotEmpty()
  transmission: string;

  @ApiProperty({ example: 650000 })
  @IsNumber()
  exShowroomPrice: number;

  @ApiPropertyOptional({ example: '{"airbags": 2, "abs": true}' })
  @IsString()
  @IsOptional()
  featuresJson?: string;

  @ApiPropertyOptional({ example: '{"engine": "1197cc"}' })
  @IsString()
  @IsOptional()
  specsJson?: string;
}

export class UpdateVariantDto extends PartialType(CreateVariantDto) {}
