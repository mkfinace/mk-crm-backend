import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: 'user-id-of-sender' })
  @IsString()
  @IsNotEmpty()
  senderUserId: string;

  @ApiPropertyOptional({ example: 'user-id-of-recipient' })
  @IsString()
  @IsOptional()
  recipientUserId?: string;

  @ApiProperty({ example: 'Customer confirmed the finance documents are ready.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: false, description: 'Whether the customer can see this message' })
  @IsBoolean()
  @IsOptional()
  customerVisible?: boolean;
}
