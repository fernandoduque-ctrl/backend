import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

@ApiTags('audit-log')
@ApiBearerAuth()
@Controller('audit-log')
export class AuditLogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar eventos de auditoria',
    description:
      'Retorna o histórico de auditoria da empresa em contexto, do mais recente para o mais antigo, ' +
      'incluindo dados resumidos do usuário que originou o evento quando disponível.',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description:
      'Quantidade máxima de registros (padrão 100, teto 500). Valores inválidos caem no padrão.',
    example: '50',
  })
  async list(@Query('take') take?: string) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const n = Math.min(parseInt(take || '100', 10) || 100, 500);
    return this.prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: n,
      include: { user: { select: { name: true, email: true } } },
    });
  }
}
