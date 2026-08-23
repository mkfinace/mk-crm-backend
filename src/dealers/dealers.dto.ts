import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({ example: '9824700000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@citymotors.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateDealerDto {
  @ApiPropertyOptional({ example: 'City Motors' })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiPropertyOptional({ example: '9824700000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@citymotors.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

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
