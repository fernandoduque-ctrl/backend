import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from './companies-context.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/update-company.dto';
import { UpsertContactPersonDto } from './dto/contact-person.dto';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get('current')
  @ApiOperation({
    summary: 'Empresa atual no contexto',
    description:
      'Retorna a empresa resolvida pelo interceptor de contexto (JWT do cliente ou `X-Company-Id` / padrão para admin/consultor), ' +
      'incluindo a pessoa de contato quando cadastrada.',
  })
  async current() {
    const id = this.ctx.getCurrentCompanyId();
    return this.prisma.company.findUnique({
      where: { id },
      include: { contactPerson: true },
    });
  }

  @Get('list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CONSULTANT)
  @ApiOperation({
    summary: 'Catálogo de empresas',
    description:
      'Lista todas as empresas cadastradas com id, nome de exibição e CNPJ. ' +
      'Restrito a **ADMIN** e **CONSULTANT**; usado para troca de contexto e visão global.',
  })
  listCatalog() {
    return this.prisma.company.findMany({
      select: { id: true, clientDisplayName: true, taxId: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar empresa',
    description:
      'Cadastra uma nova empresa cliente com dados básicos. Após a criação, associe usuários e continue o onboarding no assistente.',
  })
  create(@Body() dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        clientDisplayName: dto.clientDisplayName,
        legalName: dto.legalName,
        taxId: dto.taxId,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        hasBranches: dto.hasBranches ?? false,
        hasDifferentBranchLogos: dto.hasDifferentBranchLogos ?? false,
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar empresa',
    description:
      'Atualiza campos opcionais da empresa. O `id` na URL deve pertencer ao contexto autorizado (`requireCompany`).',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador UUID da empresa a atualizar.',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    await this.ctx.requireCompany(id);
    return this.prisma.company.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  @Get(':companyId/contact-person')
  @ApiOperation({
    summary: 'Obter pessoa de contato',
    description: 'Retorna o registro de pessoa de contato vinculado à empresa informada, se existir.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'UUID da empresa.',
  })
  async getContact(@Param('companyId') companyId: string) {
    await this.ctx.requireCompany(companyId);
    return this.prisma.contactPerson.findUnique({ where: { companyId } });
  }

  @Put(':companyId/contact-person')
  @ApiOperation({
    summary: 'Criar ou atualizar pessoa de contato',
    description:
      'Faz upsert da pessoa de contato da empresa (nome obrigatório; CPF, e-mail e telefone opcionais).',
  })
  @ApiParam({
    name: 'companyId',
    description: 'UUID da empresa.',
  })
  async putContact(
    @Param('companyId') companyId: string,
    @Body() dto: UpsertContactPersonDto,
  ) {
    await this.ctx.requireCompany(companyId);
    return this.prisma.contactPerson.upsert({
      where: { companyId },
      create: { companyId, ...dto },
      update: { ...dto },
    });
  }
}
