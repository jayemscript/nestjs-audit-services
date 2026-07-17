//src/audit/schemas/audit-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AuditStatus, ActionType } from '../../common/enums';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true })
  appId!: string;

  @Prop({ required: true })
  trasnsactionId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  performedBy!: string;

  @Prop({
    type: String,
    enum: ActionType,
    required: true,
  })
  actionType!: ActionType;

  @Prop({
    type: String,
    enum: AuditStatus,
    required: true,
    default: AuditStatus.PENDING,
  })
  status!: AuditStatus;

  @Prop({ type: Object, default: null })
  before?: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  after?: Record<string, any> | null;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
