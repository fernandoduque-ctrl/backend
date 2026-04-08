import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';
import { WizardStatus } from '../../common/prisma-enums';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo do painel principal',
    description:
      'Agrega visão geral do onboarding da empresa atual: dados da empresa e contato, percentual estimado de conclusão, ' +
      'cartões por etapa do wizard com progresso de passos, últimos arquivos enviados, linha do tempo de auditoria, ' +
      'lista textual de pendências (ex.: etapas reprovadas) e números das etapas bloqueadas.',
  })
  async summary() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { contactPerson: true },
    });
    const stages = await this.prisma.wizardStage.findMany({
      where: { companyId },
      orderBy: { stageNumber: 'asc' },
    });
    const steps = await this.prisma.wizardStepProgress.findMany({
      where: { companyId },
    });
    const uploads = await this.prisma.uploadedFile.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const audits = await this.prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    });

    const totalStages = 6;
    const approvedOrPending = stages.filter(
      (s) =>
        s.status === WizardStatus.APPROVED ||
        s.status === WizardStatus.PENDING_VALIDATION ||
        s.status === WizardStatus.IN_PROGRESS,
    ).length;
    const percentComplete = Math.round((approvedOrPending / totalStages) * 100);

    const stageCards = stages.map((s) => {
      const stSteps = steps.filter((x) => x.stageNumber === s.stageNumber);
      const done = stSteps.filter((x) => x.status === 'COMPLETED').length;
      const total = stSteps.length || 1;
      return {
        stageNumber: s.stageNumber,
        title: s.title,
        status: s.status,
        stepProgress: Math.round((done / total) * 100),
        updatedAt: s.updatedAt,
      };
    });

    const pendencias: string[] = [];
    stages.forEach((s) => {
      if (s.status === WizardStatus.REJECTED) {
        pendencias.push(`Etapa ${s.stageNumber} reprovada: ${s.reviewerNotes || 'sem notas'}`);
      }
    });

    return {
      company,
      onboardingPercent: percentComplete,
      stages: stageCards,
      recentUploads: uploads,
      auditTimeline: audits,
      pendencias,
      blockedStages: stages.filter((s) => s.status === WizardStatus.BLOCKED).map((s) => s.stageNumber),
    };
  }
}
