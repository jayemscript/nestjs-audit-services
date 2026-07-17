//src/audit/audit.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { CreateAuditDto } from './dto/create-audit.dto';
import { AuditStatus } from 'src/common/enums';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async create(createAuditDto: CreateAuditDto): Promise<AuditLog> {
    this.logger.log(
      `Creating audit log for appId=${createAuditDto.appId} transactionId=${createAuditDto.trasnsactionId}`,
    );

    try {
      const created = new this.auditLogModel({
        ...createAuditDto,
        status: createAuditDto.status ?? AuditStatus.PENDING,
      });

      const saved = await created.save();

      this.logger.log(
        `Audit log created successfully id=${saved._id} appId=${saved.appId}`,
      );

      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create audit log for appId=${createAuditDto.appId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async findAllByAppId(appId: string): Promise<AuditLog[]> {
    this.logger.log(`Fetching all audit logs for appId=${appId}`);

    try {
      const logs = await this.auditLogModel
        .find({ appId })
        .sort({ createdAt: -1 })
        .exec();

      if (!logs.length) {
        this.logger.warn(`No audit logs found for appId=${appId}`);
        throw new NotFoundException(`No audit logs found for appId=${appId}`);
      }

      this.logger.log(`Found ${logs.length} audit log(s) for appId=${appId}`);

      return logs;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch audit logs for appId=${appId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async findByTransactionIdAndAppId(
    trasnsactionId: string,
    appId: string,
  ): Promise<AuditLog[]> {
    this.logger.log(
      `Fetching audit logs for transactionId=${trasnsactionId} appId=${appId}`,
    );

    try {
      const logs = await this.auditLogModel
        .find({ trasnsactionId, appId })
        .sort({ createdAt: -1 })
        .exec();

      if (!logs.length) {
        this.logger.warn(
          `No audit logs found for transactionId=${trasnsactionId} appId=${appId}`,
        );
        throw new NotFoundException(
          `No audit logs found for transactionId=${trasnsactionId} and appId=${appId}`,
        );
      }

      this.logger.log(
        `Found ${logs.length} audit log(s) for transactionId=${trasnsactionId} appId=${appId}`,
      );

      return logs;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch audit logs for transactionId=${trasnsactionId} appId=${appId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
