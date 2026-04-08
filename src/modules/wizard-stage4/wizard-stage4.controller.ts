import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

@ApiTags('wizard-stage-4')
@ApiBearerAuth()
@Controller('wizard/stage-4')
export class WizardStage4Controller {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo da etapa 4 — benefícios',
    description:
      'Lista benefícios com fornecedores e layouts, checklist de regras (definição, valores, fornecedores, aceite `understoodAck`) ' +
      'e alertas de VT quando desconto acima de 6%.',
  })
  async summary() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const benefits = await this.prisma.benefit.findMany({
      where: { companyId },
      include: { suppliers: { include: { layoutFiles: true } } },
    });
    const vtAlerts = benefits
      .filter((b) => b.transportDiscountPercent != null && Number(b.transportDiscountPercent) > 6)
      .map((b) => ({
        benefitId: b.id,
        message: 'Desconto VT acima de 6% — verifique conformidade com a CLT.',
      }));
    return {
      checklist: {
        benefitsDefined: benefits.length > 0,
        rulesOk: benefits.every((b) => b.paymentRuleType),
        valuesOk: benefits.every((b) => b.defaultValue != null),
        suppliersLinked: benefits.every((b) => b.suppliers.length > 0),
        understoodAck: benefits.every((b) => b.understoodAck),
      },
      vtAlerts,
      benefits,
    };
  }
}
