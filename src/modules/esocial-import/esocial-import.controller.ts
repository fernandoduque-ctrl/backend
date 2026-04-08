import { Controller, Get, Post, Body, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { ESocialEnvironment } from '../../common/prisma-enums';
import { EsocialImportService } from './esocial-import.service';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

class CreateBatchDto {
  @ApiProperty({
    description:
      'Tipo de certificado digital utilizado na integração (ex.: A1, A3 — conforme cadastro no fluxo do cliente).',
    example: 'A1',
  })
  @IsString()
  certificateType: string;

  @ApiPropertyOptional({
    description: 'CNPJ vinculado ao certificado, quando aplicável.',
    example: '12.345.678/0001-90',
  })
  @IsOptional()
  @IsString()
  certificateTaxId?: string;

  @ApiPropertyOptional({
    description:
      'Dica ou referência de senha do certificado (não armazena a senha real; uso interno de lembrete seguro).',
  })
  @IsOptional()
  @IsString()
  certificatePasswordHint?: string;

  @ApiProperty({
    enum: ESocialEnvironment,
    enumName: 'ESocialEnvironment',
    description:
      '`PRODUCTION`: ambiente de produção. `RESTRICTED_PRODUCTION`: ambiente restrito de testes do eSocial.',
    example: ESocialEnvironment.RESTRICTED_PRODUCTION,
  })
  @IsEnum(ESocialEnvironment)
  environment: ESocialEnvironment;

  @ApiProperty({
    description: 'Data inicial do período de eventos a importar (ISO 8601).',
    example: '2025-01-01',
  })
  @IsDateString()
  periodStart: string;

  @ApiProperty({
    description: 'Data final do período de eventos a importar (ISO 8601).',
    example: '2025-01-31',
  })
  @IsDateString()
  periodEnd: string;

  @ApiProperty({
    type: [String],
    description:
      'Lista de códigos ou identificadores de eventos do eSocial selecionados para este lote (conforme contrato do serviço).',
    example: ['S-1200', 'S-1210'],
  })
  @IsArray()
  @IsString({ each: true })
  selectedEvents: string[];
}

class ConfirmDto {
  @ApiProperty({
    description:
      'Deve ser verdadeiro para confirmar que o responsável leu e aceita o texto legal/resumo exibido antes de confirmar o lote.',
    example: true,
  })
  @IsBoolean()
  confirmationTextAccepted: boolean;
}

@ApiTags('esocial-import')
@ApiBearerAuth()
@Controller('esocial-import')
export class EsocialImportController {
  constructor(private readonly svc: EsocialImportService) {}

  @Post('batches')
  @ApiOperation({
    summary: 'Criar lote de importação eSocial',
    description:
      'Abre um novo lote com período, ambiente e eventos selecionados. O usuário e papel influenciam permissões no serviço.',
  })
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateBatchDto) {
    return this.svc.createBatch(user.sub, user.role, {
      certificateType: dto.certificateType,
      certificateTaxId: dto.certificateTaxId,
      certificatePasswordHint: dto.certificatePasswordHint,
      environment: dto.environment as 'PRODUCTION' | 'RESTRICTED_PRODUCTION',
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      selectedEvents: dto.selectedEvents,
    });
  }

  @Get('batches')
  @ApiOperation({
    summary: 'Listar lotes de importação',
    description: 'Lista lotes de importação visíveis no contexto atual, do mais recente ao mais antigo.',
  })
  list() {
    return this.svc.listBatches();
  }

  @Get('batches/:id')
  @ApiOperation({
    summary: 'Detalhar lote',
    description: 'Retorna status e metadados completos de um lote pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do lote de importação.' })
  one(@Param('id') id: string) {
    return this.svc.getBatch(id);
  }

  @Get('batches/:id/preview')
  @ApiOperation({
    summary: 'Pré-visualizar resultado do lote',
    description:
      'Dados de pré-visualização antes da confirmação definitiva (conteúdo conforme implementação do serviço).',
  })
  @ApiParam({ name: 'id', description: 'UUID do lote de importação.' })
  preview(@Param('id') id: string) {
    return this.svc.preview(id);
  }

  @Post('batches/:id/process')
  @ApiOperation({
    summary: 'Processar lote',
    description: 'Dispara o processamento assíncrono ou síncrono dos eventos do lote.',
  })
  @ApiParam({ name: 'id', description: 'UUID do lote de importação.' })
  process(@Param('id') id: string) {
    return this.svc.processBatch(id);
  }

  @Post('batches/:id/confirm')
  @ApiOperation({
    summary: 'Confirmar lote',
    description:
      'Confirma o lote após revisão; exige `confirmationTextAccepted: true` para registrar aceite explícito.',
  })
  @ApiParam({ name: 'id', description: 'UUID do lote de importação.' })
  confirm(@Param('id') id: string, @CurrentUser() user: JwtUser, @Body() dto: ConfirmDto) {
    return this.svc.confirmBatch(id, user.sub, dto.confirmationTextAccepted);
  }

  @Get('batches/:id/alerts')
  @ApiOperation({
    summary: 'Listar alertas do lote',
    description: 'Alertas e avisos gerados durante processamento ou validação do lote.',
  })
  @ApiParam({ name: 'id', description: 'UUID do lote de importação.' })
  alerts(@Param('id') id: string) {
    return this.svc.alerts(id);
  }

  @Get('batches/:id/logs')
  @ApiOperation({
    summary: 'Listar logs do lote',
    description: 'Linhas de log técnicas ou de negócio associadas ao processamento do lote.',
  })
  @ApiParam({ name: 'id', description: 'UUID do lote de importação.' })
  logs(@Param('id') id: string) {
    return this.svc.logs(id);
  }

  @Get('batches/:id/export-log')
  @ApiOperation({
    summary: 'Exportar log como arquivo texto',
    description:
      'Baixa um arquivo `.txt` com o log consolidado do lote (Content-Disposition attachment). Adequado para arquivo ou suporte.',
  })
  @ApiProduces('text/plain')
  @ApiParam({ name: 'id', description: 'UUID do lote de importação.' })
  async exportLog(@Param('id') id: string, @Res({ passthrough: false }) res: Response) {
    const text = await this.svc.buildExportLog(id);
    const safe = id.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 12) || 'lote';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="esocial-lote-${safe}.txt"`);
    res.send(text);
  }
}
