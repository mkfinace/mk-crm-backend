import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateColourDto {
  @IsString()
  name: string;

  @IsString()
  hexCode: string;

  @ApiPropertyOptional({ enum: ['EXTERIOR', 'INTERIOR'] })
  @IsOptional()
  @IsIn(['EXTERIOR', 'INTERIOR'])
  type?: string;
}

export class UpdateColourDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hexCode?: string;

  @ApiPropertyOptional({ enum: ['EXTERIOR', 'INTERIOR'] })
  @IsOptional()
  @IsIn(['EXTERIOR', 'INTERIOR'])
  type?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'ARCHIVED'])
  status?: string;
}

export class VehicleColourInput {
  colourId: string;
  imageUrl?: string;
  isDefault?: boolean;
}

export class SetVehicleColoursDto {
  items: VehicleColourInput[];
}
