import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export const FIELD_DATA_TYPES = [
  'TEXT', 'LONG_TEXT', 'INTEGER', 'NUMBER', 'DECIMAL', 'BOOLEAN',
  'SELECT', 'MULTI_SELECT', 'CURRENCY', 'PERCENTAGE', 'DATE',
  'VALUE_UNIT', 'IMAGE', 'URL',
];

export const FIELD_APPLICABILITY = ['STANDARD', 'OPTIONAL', 'NOT_AVAILABLE', 'PACKAGE', 'ACCESSORY'];

export class CreateFieldCategoryDto {
  @ApiProperty({ example: 'Safety' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}

export class UpdateFieldCategoryDto {
  @ApiPropertyOptional({ example: 'Safety & ADAS' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class FieldOptionInput {
  @ApiProperty({ example: 'Yes' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'yes' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateFieldDefinitionDto {
  @ApiProperty({ example: 'cat-id-here' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Number of Airbags' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'airbags_count' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ example: 'airbag count, no of airbags' })
  @IsString()
  @IsOptional()
  alias?: string;

  @ApiProperty({ example: 'INTEGER', enum: FIELD_DATA_TYPES })
  @IsIn(FIELD_DATA_TYPES)
  dataType: string;

  @ApiPropertyOptional({ example: 'mm' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  customerVisible?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  filterEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  comparisonEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ type: [FieldOptionInput], description: 'Required only when dataType is SELECT or MULTI_SELECT' })
  @IsOptional()
  options?: FieldOptionInput[];
}

export class UpdateFieldDefinitionDto {
  @ApiPropertyOptional({ example: 'Number of Airbags' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'airbag count, no of airbags' })
  @IsString()
  @IsOptional()
  alias?: string;

  @ApiPropertyOptional({ example: 'mm' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  customerVisible?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  filterEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  comparisonEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class SetFieldValueDto {
  @ApiProperty({ example: 'field-id-here' })
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @ApiProperty({ example: 'variant-id-here' })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiPropertyOptional({ example: 'Automatic climate control' })
  @IsString()
  @IsOptional()
  valueText?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsNumber()
  @IsOptional()
  valueNumber?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  valueBoolean?: boolean;

  @ApiPropertyOptional({ example: 'STANDARD', enum: FIELD_APPLICABILITY })
  @IsIn(FIELD_APPLICABILITY)
  @IsOptional()
  applicability?: string;
}
