//src/audit/audit.controller.ts
import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }

  @Get('get/:appId')
  @HttpCode(HttpStatus.OK)
  async getAllByAppId(@Param('appId') appId: string) {
    return this.auditService.findAllByAppId(appId);
  }

  @Get('get/:transactionId/:appId')
  @HttpCode(HttpStatus.OK)
  async getByTransactionIdAndAppId(
    @Param('transactionId') transactionId: string,
    @Param('appId') appId: string,
  ) {
    return this.auditService.findByTransactionIdAndAppId(transactionId, appId);
  }
}
