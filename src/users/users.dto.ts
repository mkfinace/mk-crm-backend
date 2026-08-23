import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiProperty({ example: 'ADMIN', description: 'Matches UserRole enum e.g. ADMIN, DEALER_EXECUTIVE, FINANCE_EXECUTIVE' })
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
