import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WizardStatus } from '../../common/prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';
import { onlyDigits, isValidCNPJ } from '../../common/utils/br-validators';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('wizard-importacao-esocial')
@ApiBearerAuth()
@Controller('wizard/importacao-esocial')
export class WizardImportacaoEsocialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get('access')
  @ApiOperation({
    summary: 'Verificar pré-requisitos da etapa 6 (eSocial)',
    description:
      'Indica se o usuário pode operar a importação eSocial: CNPJ da matriz válido e etapas 1 a 5 com status APROVADO. ' +
      'Retorna motivos em `reasons` quando bloqueado, estado da etapa 6 e URL sugerida dos lotes.',
  })
  async access() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    const stages = await this.prisma.wizardStage.findMany({
      where: { companyId },
      orderBy: { stageNumber: 'asc' },
    });
    const reasons: string[] = [];
    let allowed = true;
    const cnpj = company?.taxId ? onlyDigits(company.taxId) : '';
    if (cnpj.length !== 14 || !isValidCNPJ(company!.taxId!)) {
      allowed = false;
      reasons.push('CNPJ da matriz ausente ou inválido.');
    }
    for (let n = 1; n <= 5; n++) {
      const st = stages.find((s) => s.stageNumber === n);
      if (!st || st.status !== WizardStatus.APPROVED) {
        allowed = false;
        reasons.push(`Etapa ${n} deve estar aprovada.`);
      }
    }
    const etapaImportacaoEsocial = stages.find((s) => s.stageNumber === 6);
    return {
      allowed,
      reasons,
      companyId,
      etapaImportacaoEsocial,
      batchesUrl: '/esocial-import/batches',
    };
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo da etapa 6 com lotes recentes',
    description:
      'Mesmo critério de `access` mais até cinco lotes de importação eSocial recentes da empresa.',
  })
  async summary(@CurrentUser() user: JwtUser) {
    const access = await this.access(user);
    const companyId = await this.ctx.getCurrentCompanyId();
    const batches = await this.prisma.eSocialImportBatch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return { ...access, recentBatches: batches };
  }
}
