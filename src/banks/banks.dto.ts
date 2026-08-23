import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBankDto {
  @ApiProperty({ example: 'HDFC Bank' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '9824700000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@hdfcbank.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateBankDto {
  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '9824700000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@hdfcbank.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CreateBankBranchDto {
  @ApiProperty({ example: 'Valsad Branch' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Valsad' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Valsad, Dharampur' })
  @IsString()
  @IsOptional()
  serviceArea?: string;

  @ApiPropertyOptional({ example: '{"minAge": 21, "minIncome": 25000}' })
  @IsString()
  @IsOptional()
  vehicleEligibilityJson?: string;
}

export class AssignFinanceExecutiveDto {
  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ example: 'branch-id-here' })
  @IsString()
  @IsOptional()
  branchId?: string;
}
