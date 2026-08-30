import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  variantId: string;

  @IsIn(['FIELD_VALUES', 'FEATURES', 'COLOURS', 'WARRANTY'])
  changeType: string;

  @IsObject()
  payload: any;

  @IsOptional()
  @IsString()
  summary?: string;
}

export class ReviewSubmissionDto {
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
