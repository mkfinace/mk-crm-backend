import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ColourInput {
  name: string;
  hex: string;
}

export class UpsertVehicleDto {
  @ApiPropertyOptional({ type: [ColourInput], example: [{ name: 'Pearl White', hex: '#F4F4F4' }] })
  @IsOptional()
  colours?: ColourInput[];

  @ApiPropertyOptional({ type: [String], example: ['https://example.com/car-front.jpg'] })
  @IsOptional()
  images?: string[];
}
