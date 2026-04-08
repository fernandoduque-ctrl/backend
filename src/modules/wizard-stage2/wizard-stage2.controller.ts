import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

@ApiTags('wizard-stage-2')
@ApiBearerAuth()
@Controller('wizard/stage-2')
export class WizardStage2Controller {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo da etapa 2 — estrutura operacional',
    description:
      'Checklist agregado: presença de jornadas de trabalho, centros de custo, bancos de pagamento de salários e departamentos. ' +
      'Inclui contagens numéricas para exibir progresso na UI.',
  })
  async summary() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const [ws, cc, banks, dept] = await Promise.all([
      this.prisma.workSchedule.count({ where: { companyId } }),
      this.prisma.costCenter.count({ where: { companyId } }),
      this.prisma.employeePaymentBank.count({ where: { companyId } }),
      this.prisma.department.count({ where: { companyId } }),
    ]);
    return {
      checklist: {
        workSchedules: ws > 0,
        costCenters: cc > 0,
        banks: banks > 0,
        departments: dept > 0,
      },
      counts: { workSchedules: ws, costCenters: cc, banks, departments: dept },
    };
  }
}
