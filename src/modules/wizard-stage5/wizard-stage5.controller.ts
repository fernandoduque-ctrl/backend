import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

@ApiTags('wizard-stage-5')
@ApiBearerAuth()
@Controller('wizard/stage-5')
export class WizardStage5Controller {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo da etapa 5 — rubricas',
    description:
      'Valida se existem rubricas cadastradas e se há ao menos uma incidência (INSS, FGTS, IRRF ou eSocial) em cada uma. ' +
      'Retorna quantidade total de rubricas.',
  })
  async summary() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const rubrics = await this.prisma.payrollRubric.findMany({ where: { companyId } });
    return {
      checklist: {
        rubricsCadastradas: rubrics.length > 0,
        incidencias: rubrics.every(
          (r) => r.incidenceINSS || r.incidenceFGTS || r.incidenceIRRF || r.incidenceESocial,
        ),
        defaults: true,
      },
      count: rubrics.length,
    };
  }
}
