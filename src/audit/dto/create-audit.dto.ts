//src/audit/dto/create-audit.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ActionType, AuditStatus } from 'src/common/enums';

export class CreateAuditDto {
  @IsString()
  @IsNotEmpty()
  appId!: string;

  @IsString()
  @IsNotEmpty()
  trasnsactionId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  performedBy!: string;

  @IsEnum(ActionType)
  @IsNotEmpty()
  actionType!: ActionType;

  @IsEnum(AuditStatus)
  @IsOptional()
  status?: AuditStatus;

  @IsObject()
  @IsOptional()
  before?: Record<string, any>;

  @IsObject()
  @IsOptional()
  after?: Record<string, any>;
}
