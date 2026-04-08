import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';
import { StepStatus, WizardStatus } from '../../common/prisma-enums';

@Injectable()
export class WizardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  async listStages() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.wizardStage.findMany({
      where: { companyId },
      orderBy: { stageNumber: 'asc' },
    });
  }

  async getStage(stageNumber: number) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const stage = await this.prisma.wizardStage.findUnique({
      where: { companyId_stageNumber: { companyId, stageNumber } },
    });
    if (!stage) throw new NotFoundException('Etapa não encontrada');
    const steps = await this.prisma.wizardStepProgress.findMany({
      where: { companyId, stageNumber },
      orderBy: { stepNumber: 'asc' },
    });
    return { ...stage, steps };
  }

  async submitForValidation(stageNumber: number) {
    const companyId = await this.ctx.getCurrentCompanyId();
    if (stageNumber > 1) {
      const prev = await this.prisma.wizardStage.findUnique({
        where: { companyId_stageNumber: { companyId, stageNumber: stageNumber - 1 } },
      });
      if (!prev || prev.status !== WizardStatus.APPROVED) {
        throw new BadRequestException('Complete e obtenha aprovação da etapa anterior.');
      }
    }
    return this.prisma.wizardStage.update({
      where: { companyId_stageNumber: { companyId, stageNumber } },
      data: {
        status: WizardStatus.PENDING_VALIDATION,
        submittedForValidationAt: new Date(),
      },
    });
  }

  async approve(stageNumber: number, notes?: string) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.wizardStage.update({
      where: { companyId_stageNumber: { companyId, stageNumber } },
      data: {
        status: WizardStatus.APPROVED,
        approvedAt: new Date(),
        reviewerNotes: notes ?? null,
      },
    });
  }

  async reject(stageNumber: number, notes: string) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.wizardStage.update({
      where: { companyId_stageNumber: { companyId, stageNumber } },
      data: {
        status: WizardStatus.REJECTED,
        rejectedAt: new Date(),
        reviewerNotes: notes,
      },
    });
  }

  /** Marca passo do wizard como concluído (ex.: pensão “não” = passo 2 etapa 3). */
  async completeStep(stageNumber: number, stepNumber: number) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const row = await this.prisma.wizardStepProgress.findUnique({
      where: {
        companyId_stageNumber_stepNumber: { companyId, stageNumber, stepNumber },
      },
    });
    if (!row) throw new NotFoundException('Passo não encontrado');
    return this.prisma.wizardStepProgress.update({
      where: {
        companyId_stageNumber_stepNumber: { companyId, stageNumber, stepNumber },
      },
      data: { status: StepStatus.COMPLETED, completedAt: new Date() },
    });
  }
}
