import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'lead-id-here' })
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  bookingAmount: number;

  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  bookedBy: string;
}
