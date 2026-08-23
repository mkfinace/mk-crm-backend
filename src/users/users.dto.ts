import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Kiran Ahir' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9824742356' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiPropertyOptional({ example: 'kirandahir@gmail.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'SUPER_ADMIN', description: 'SUPER_ADMIN, SALES_ADMIN, FINANCE_ADMIN, DEALER_MANAGER, DEALER_EXECUTIVE, FINANCE_EXECUTIVE, CUSTOMER' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiPropertyOptional({ example: 'dealer-id-here' })
  @IsString()
  @IsOptional()
  dealerId?: string;

  @ApiPropertyOptional({ example: 'bank-id-here' })
  @IsString()
  @IsOptional()
  bankId?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class LoginDto {
  @ApiProperty({ example: '9824742356' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
