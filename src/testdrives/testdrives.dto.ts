import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTestDriveDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: '2026-08-30T11:00:00Z' })
  @IsString()
  @IsNotEmpty()
  scheduledAt: string;
}

export class UpdateTestDriveDto {
  @ApiPropertyOptional({ example: '2026-08-31T11:00:00Z' })
  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'COMPLETED', description: 'SCHEDULED, COMPLETED, CANCELLED' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Customer liked the ride quality' })
  @IsString()
  @IsOptional()
  feedback?: string;
}
