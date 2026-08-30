import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ExtendedWarrantyOptionInput {
  label: string;
  price: number;
}

export class UpsertWarrantyDto {
  @IsInt()
  standardYears: number;

  @IsInt()
  standardKm: number;

  @ApiPropertyOptional({ type: [ExtendedWarrantyOptionInput] })
  @IsOptional()
  extendedOptions?: ExtendedWarrantyOptionInput[];
}
