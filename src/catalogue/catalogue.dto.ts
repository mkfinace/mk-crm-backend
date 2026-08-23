import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

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

export class CreateModelDto {
  @ApiProperty({ example: 'clx1234567890', description: 'ID of the brand this model belongs to' })
  @IsString()
  @IsNotEmpty()
  brandId: string;

  @ApiProperty({ example: 'Swift' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateVariantDto {
  @ApiProperty({ example: 'clx1234567890', description: 'ID of the model this variant belongs to' })
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @ApiProperty({ example: 'LXi' })
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

  @ApiProperty({ example: 649000 })
  @IsNumber()
  exShowroomPrice: number;

  @ApiPropertyOptional({ example: '["ABS","6 Airbags"]' })
  @IsString()
  @IsOptional()
  featuresJson?: string;

  @ApiPropertyOptional({ example: '{"engine":"1197cc"}' })
  @IsString()
  @IsOptional()
  specsJson?: string;
}
