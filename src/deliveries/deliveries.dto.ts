import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: '2026-09-05T10:00:00Z' })
  @IsString()
  @IsNotEmpty()
  scheduledAt: string;
}

export class UpdateDeliveryDto {
  @ApiPropertyOptional({ example: '2026-09-06T10:00:00Z' })
  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'DELIVERED', description: 'SCHEDULED, DELIVERED, DELAYED' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: '2026-09-06T14:30:00Z' })
  @IsString()
  @IsOptional()
  deliveredAt?: string;
}
