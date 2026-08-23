import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'LEAD_ASSIGNED' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'New lead assigned to you' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Ramesh Patel is interested in Maruti Suzuki Swift.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: 'IN_APP', description: 'IN_APP, EMAIL, SMS, WHATSAPP' })
  @IsString()
  @IsOptional()
  channel?: string;
}
