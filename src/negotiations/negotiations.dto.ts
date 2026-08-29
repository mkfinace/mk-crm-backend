import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateNegotiationDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiPropertyOptional({ example: 680000 })
  @IsNumber()
  @IsOptional()
  customerExpectedPrice?: number;

  @ApiPropertyOptional({ example: 700000 })
  @IsNumber()
  @IsOptional()
  dealerOfferedPrice?: number;

  @ApiPropertyOptional({ example: 20000 })
  @IsNumber()
  @IsOptional()
  discountRequested?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsNumber()
  @IsOptional()
  exchangeValueOffered?: number;

  @ApiPropertyOptional({ example: 'Free floor mats + seat covers' })
  @IsString()
  @IsOptional()
  accessoriesOffered?: string;

  @ApiPropertyOptional({ example: 'Festival offer — extra ₹5000 off' })
  @IsString()
  @IsOptional()
  specialOffer?: string;

  @ApiPropertyOptional({ example: 'Customer compared with Hyundai dealer nearby' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DecideNegotiationDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional({ example: 15000, description: 'Optional — final approved discount if different from what was requested' })
  @IsNumber()
  @IsOptional()
  discountApproved?: number;
}
