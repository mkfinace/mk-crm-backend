import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Ramesh Patel' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '9824742356' })
  @IsString()
  @IsNotEmpty()
  customerMobile: string;

  @ApiPropertyOptional({ example: 'Valsad' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'cmt5bwygv00029u2bfnf16ocd' })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ example: 'cmt5c8ndt0005co2b5rn4es5o' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ example: 'cmt5cchwa0007co2b7qxy31k5' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({ example: 700000 })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  financeRequired?: boolean;

  @ApiPropertyOptional({ example: '2026-09-15' })
  @IsString()
  @IsOptional()
  expectedPurchaseDate?: string;

  @ApiPropertyOptional({ example: 'WEBSITE' })
  @IsString()
  @IsOptional()
  source?: string;

  // ---- Phase A: Customer Qualification + Lead Temperature ----
  @ApiPropertyOptional({ example: 'WARM', description: 'HOT, WARM, COLD' })
  @IsString()
  @IsOptional()
  temperature?: string;

  @ApiPropertyOptional({ example: 'Family', description: 'Family, Personal, Business, Other' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({ example: 'Self' })
  @IsString()
  @IsOptional()
  decisionMaker?: string;

  @ApiPropertyOptional({ example: 'Maruti Alto 2015' })
  @IsString()
  @IsOptional()
  currentCar?: string;

  @ApiPropertyOptional({ example: 150000 })
  @IsNumber()
  @IsOptional()
  exchangeValue?: number;

  @ApiPropertyOptional({ example: 'Price', description: 'Price, Features, Mileage, Safety, Performance, DeliveryTime, Colour' })
  @IsString()
  @IsOptional()
  customerPriority?: string;

  @ApiPropertyOptional({ example: 'Petrol' })
  @IsString()
  @IsOptional()
  fuelPreference?: string;

  @ApiPropertyOptional({ example: 'Automatic' })
  @IsString()
  @IsOptional()
  transmissionPreference?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsString()
  @IsOptional()
  colourPreference?: string;

  @ApiPropertyOptional({ example: 'Needs a wheelchair-accessible boot' })
  @IsString()
  @IsOptional()
  specialRequirements?: string;

  @ApiPropertyOptional({ example: 'Very price-sensitive, compares with Hyundai a lot' })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}

export class AssignLeadDto {
  @ApiPropertyOptional({ example: 'dealer-id-here', description: 'The dealership this lead is handled by' })
  @IsString()
  @IsOptional()
  dealerId?: string;

  @ApiPropertyOptional({ example: 'user-id-of-dealer-exec', description: 'Must belong to the selected dealer' })
  @IsString()
  @IsOptional()
  dealerExecutiveId?: string;

  @ApiPropertyOptional({ example: 'bank-id-here', description: 'The bank handling this lead\'s finance' })
  @IsString()
  @IsOptional()
  bankId?: string;

  @ApiPropertyOptional({ example: 'user-id-of-finance-exec', description: 'Must belong to the selected bank' })
  @IsString()
  @IsOptional()
  financeExecutiveId?: string;

  @ApiProperty({ example: 'user-id-of-assigner' })
  @IsString()
  @IsNotEmpty()
  assignedBy: string;
}

export class UpdateSalesStatusDto {
  @ApiProperty({ example: 'CONTACTED', description: 'NEW, CONTACTED, QUALIFIED, INTERESTED, TEST_DRIVE, QUOTATION, NEGOTIATION, BOOKING, DELIVERY, CLOSED, HOLD, LOST' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ example: 'Price High', description: 'Mandatory only when status is LOST' })
  @IsString()
  @IsOptional()
  lostReasonId?: string;
}

export class UpdateFinanceStatusDto {
  @ApiProperty({ example: 'PENDING', description: 'NOT_REQUIRED, PENDING, DOCUMENTS, LOGIN, VERIFICATION, BANK_QUERY, QUERY_RESOLVED, SANCTION, AGREEMENT, DISBURSEMENT, FINANCE_COMPLETED' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class AddFollowUpDto {
  @ApiProperty({ example: 'user-id-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'CALL', description: 'e.g. CALL, VISIT, WHATSAPP' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'INTERESTED' })
  @IsString()
  @IsNotEmpty()
  result: string;

  @ApiPropertyOptional({ example: 'Customer wants to test drive next week' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: '2026-08-30T10:00:00Z' })
  @IsString()
  @IsNotEmpty()
  nextFollowUpAt: string;
}
