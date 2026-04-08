import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AlertSeverity,
  ESocialEnvironment,
  ImportBatchStatus,
  WizardStatus,
} from '../../common/prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';
import { onlyDigits, isValidCNPJ } from '../../common/utils/br-validators';

@Injectable()
export class EsocialImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  async assertStage6Access(userId: string, _role: string) {
    void _role;
    /* Cliente da empresa, consultor ou admin: contexto de empresa via JWT + interceptor. */
    const companyId = await this.ctx.getCurrentCompanyId();
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company?.taxId || onlyDigits(company.taxId).length !== 14) {
      throw new BadRequestException('CNPJ da matriz obrigatório e válido para a Etapa 6.');
    }
    if (!isValidCNPJ(company.taxId)) {
      throw new BadRequestException('CNPJ da empresa inválido.');
    }
    for (let s = 1; s <= 5; s++) {
      const st = await this.prisma.wizardStage.findUnique({
        where: { companyId_stageNumber: { companyId, stageNumber: s } },
      });
      if (!st || st.status !== WizardStatus.APPROVED) {
        throw new BadRequestException(
          `Etapa 6 bloqueada: a etapa ${s} precisa estar aprovada antes da importação.`,
        );
      }
    }
    return { companyId, company, userId };
  }

  async createBatch(
    userId: string,
    role: string,
    body: {
      certificateType: string;
      certificateTaxId?: string;
      certificatePasswordHint?: string;
      environment: ESocialEnvironment;
      periodStart: string;
      periodEnd: string;
      selectedEvents: string[];
    },
  ) {
    const { companyId, company } = await this.assertStage6Access(userId, role);
    const certCnpj = body.certificateTaxId ? onlyDigits(body.certificateTaxId) : '';
    const companyCnpj = onlyDigits(company!.taxId!);
    if (certCnpj && certCnpj !== companyCnpj) {
      throw new BadRequestException('CNPJ do certificado diverge do CNPJ da empresa.');
    }
    const start = new Date(body.periodStart);
    const end = new Date(body.periodEnd);
    if (start > end) throw new BadRequestException('Data inicial deve ser anterior à final.');
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months > 36) {
      throw new BadRequestException('Período máximo sugerido: 36 meses.');
    }
    if (body.certificateType === 'A1_EXPIRED_SIM') {
      throw new BadRequestException('Certificado expirado (simulação) — importação bloqueada.');
    }
    const batch = await this.prisma.eSocialImportBatch.create({
      data: {
        companyId,
        requestedById: userId,
        certificateType: body.certificateType,
        certificateTaxId: certCnpj || companyCnpj,
        certificatePasswordHint: body.certificatePasswordHint
          ? '[armazenado apenas como lembrete — não use senha real]'
          : null,
        environment: body.environment,
        periodStart: start,
        periodEnd: end,
        selectedEventsJson: JSON.stringify(body.selectedEvents),
        status: ImportBatchStatus.PENDING,
        confirmationTextAccepted: false,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        companyId,
        userId,
        action: 'ESOCIAL_BATCH_CREATED',
        entityType: 'ESocialImportBatch',
        entityId: batch.id,
        metaJson: JSON.stringify({ status: batch.status }),
      },
    });
    return batch;
  }

  async listBatches() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.eSocialImportBatch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: { requestedBy: { select: { name: true, email: true } } },
    });
  }

  async getBatch(id: string) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const batch = await this.prisma.eSocialImportBatch.findFirst({
      where: { id, companyId },
      include: {
        stageRecords: true,
        alerts: true,
        requestedBy: { select: { name: true, email: true } },
      },
    });
    if (!batch) throw new NotFoundException('Lote não encontrado');
    return batch;
  }

  async preview(id: string) {
    const batch = await this.getBatch(id);
    const workers = batch.stageRecords.filter((r) => r.recordType === 'TRABALHADOR');
    const rem = batch.stageRecords.filter((r) => r.recordType === 'REMUNERACAO');
    const vac = batch.stageRecords.filter((r) =>
      ['FERIAS', 'AFASTAMENTO'].includes(r.recordType),
    );
    return {
      batch: {
        id: batch.id,
        status: batch.status,
        periodStart: batch.periodStart,
        periodEnd: batch.periodEnd,
      },
      tabs: {
        trabalhadores: workers,
        remuneracoes: rem,
        feriasAfastamentos: vac,
      },
      counts: {
        total: batch.stageRecords.length,
        trabalhadores: workers.length,
        remuneracoes: rem.length,
        feriasAfastamentos: vac.length,
      },
    };
  }

  async processBatch(id: string) {
    const batch = await this.getBatch(id);
    if (batch.status === ImportBatchStatus.CONFIRMED) {
      throw new BadRequestException('Lote já confirmado.');
    }
    await this.prisma.eSocialImportBatch.update({
      where: { id },
      data: { status: ImportBatchStatus.PROCESSING },
    });
    await this.prisma.eSocialImportStageRecord.deleteMany({ where: { batchId: id } });
    await this.prisma.eSocialImportAlert.deleteMany({ where: { batchId: id } });

    const payloads = [
      {
        recordType: 'TRABALHADOR',
        externalId: 'S2200-001',
        payloadJson: JSON.stringify({
          nome: 'Ana Souza',
          cpf: '***',
          matricula: '1001',
          cargo: 'Analista',
        }),
        status: 'STAGED',
      },
      {
        recordType: 'TRABALHADOR',
        externalId: 'S2200-002',
        payloadJson: JSON.stringify({
          nome: 'Carlos Lima',
          cpf: '***',
          matricula: '1002',
          cargo: 'Coordenador',
        }),
        status: 'STAGED',
      },
      {
        recordType: 'REMUNERACAO',
        externalId: 'S1200-01',
        payloadJson: JSON.stringify({ competencia: '2024-12', base: 7200, proventos: 8500 }),
        status: 'STAGED',
      },
      {
        recordType: 'AFASTAMENTO',
        externalId: 'S2230-01',
        payloadJson: JSON.stringify({ tipo: 'INSS', dias: 30 }),
        status: 'STAGED',
      },
      {
        recordType: 'FERIAS',
        externalId: 'S2240-01',
        payloadJson: JSON.stringify({ situacao: 'GOZADAS', periodo: '2024-08' }),
        status: 'STAGED',
      },
    ];
    await this.prisma.eSocialImportStageRecord.createMany({
      data: payloads.map((p) => ({ batchId: id, ...p })),
    });
    await this.prisma.eSocialImportAlert.createMany({
      data: [
        {
          batchId: id,
          severity: AlertSeverity.WARNING,
          alertType: 'RUBRICA_NAO_MAPEADA',
          title: 'Rubrica não mapeada',
          description: 'Evento S1010 X998 não possui rubrica na Etapa 5.',
        },
        {
          batchId: id,
          severity: AlertSeverity.INFO,
          alertType: 'ESTRUTURA_DIFF',
          title: 'Diferença estrutura x eSocial',
          description: 'Centro de custo CC999 importado não existe na parametrização atual.',
        },
      ],
    });
    const withAlerts = ImportBatchStatus.COMPLETED_WITH_ALERTS;
    const updated = await this.prisma.eSocialImportBatch.update({
      where: { id },
      data: { status: withAlerts },
      include: { stageRecords: true, alerts: true },
    });
    await this.prisma.auditLog.create({
      data: {
        companyId: batch.companyId,
        userId: batch.requestedById,
        action: 'ESOCIAL_BATCH_PROCESSED',
        entityType: 'ESocialImportBatch',
        entityId: id,
        metaJson: JSON.stringify({ records: updated.stageRecords.length }),
      },
    });
    return updated;
  }

  async confirmBatch(id: string, userId: string, accept: boolean) {
    if (!accept) throw new BadRequestException('Confirmação obrigatória.');
    const batch = await this.getBatch(id);
    if (
      batch.status !== ImportBatchStatus.COMPLETED &&
      batch.status !== ImportBatchStatus.COMPLETED_WITH_ALERTS
    ) {
      throw new BadRequestException('Processe o lote antes de confirmar.');
    }
    const updated = await this.prisma.eSocialImportBatch.update({
      where: { id },
      data: {
        status: ImportBatchStatus.CONFIRMED,
        confirmationTextAccepted: true,
        confirmedAt: new Date(),
      },
    });
    await this.prisma.eSocialImportStageRecord.updateMany({
      where: { batchId: id },
      data: { status: 'IMPORTED' },
    });
    await this.prisma.auditLog.create({
      data: {
        companyId: batch.companyId,
        userId,
        action: 'ESOCIAL_BATCH_CONFIRMED',
        entityType: 'ESocialImportBatch',
        entityId: id,
        metaJson: JSON.stringify({
          origem: 'eSocial',
          confirmedAt: updated.confirmedAt,
        }),
      },
    });
    await this.prisma.wizardStage.updateMany({
      where: { companyId: batch.companyId, stageNumber: 6 },
      data: {
        status: WizardStatus.APPROVED,
        approvedAt: new Date(),
        completedAt: new Date(),
      },
    });
    return updated;
  }

  async alerts(id: string) {
    const batch = await this.getBatch(id);
    return batch.alerts;
  }

  async logs(id: string) {
    await this.getBatch(id);
    return this.prisma.auditLog.findMany({
      where: { entityId: id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { user: { select: { name: true, email: true } } },
    });
  }

  /** Texto único para download (auditoria + staging + alertas). */
  async buildExportLog(id: string): Promise<string> {
    const batch = await this.getBatch(id);
    const audit = await this.prisma.auditLog.findMany({
      where: { entityId: id },
      orderBy: { createdAt: 'asc' },
      take: 500,
      include: { user: { select: { name: true, email: true } } },
    });
    const lines: string[] = [];
    lines.push(`Lote eSocial — ${batch.id}`);
    lines.push(`Status: ${batch.status}`);
    lines.push(
      `Período: ${batch.periodStart.toISOString().slice(0, 10)} — ${batch.periodEnd.toISOString().slice(0, 10)}`,
    );
    lines.push(`Ambiente: ${batch.environment}`);
    lines.push('');
    lines.push('=== Registros em staging ===');
    for (const r of batch.stageRecords) {
      lines.push(`[${r.recordType}] ${r.externalId} | ${r.status}`);
      lines.push(`  ${r.payloadJson}`);
    }
    lines.push('');
    lines.push('=== Alertas ===');
    for (const a of batch.alerts) {
      lines.push(`[${a.severity}] ${a.alertType}: ${a.title}`);
      lines.push(`  ${a.description}`);
    }
    lines.push('');
    lines.push('=== Trilha de auditoria (lote) ===');
    for (const l of audit) {
      const who = l.user?.email ?? l.user?.name ?? '—';
      lines.push(`${l.createdAt.toISOString()} | ${l.action} | ${who}`);
      if (l.metaJson) lines.push(`  meta: ${l.metaJson}`);
    }
    return lines.join('\n');
  }
}
