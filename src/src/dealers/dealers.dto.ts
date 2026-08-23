import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDealerDto {
  @ApiProperty({ example: 'City Motors' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'brand-id-here' })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ example: 'Ring Road, Valsad' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Valsad' })
  @IsString()
  @IsOptional()
  city?: string;
}

export class UpdateDealerDto extends PartialType(CreateDealerDto) {}

export class CreateDealerBranchDto {
  @ApiProperty({ example: 'Valsad Main Branch' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Station Road' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Valsad' })
  @IsString()
  @IsOptional()
  city?: string;
}

export class AssignDealerManagerDto {
  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class AssignDealerExecutiveDto {
  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ example: 'branch-id-here' })
  @IsString()
  @IsOptional()
  branchId?: string;
}
