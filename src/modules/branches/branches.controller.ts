import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class BranchBodyDto {
  @ApiProperty({
    description: 'Nome da filial como será exibido no sistema.',
    example: 'Filial São Paulo',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Razão social da filial, se diferente da matriz ou do nome curto.',
  })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({
    description: 'CNPJ da filial (validado quando 14 dígitos). Usado para casar importações de centro de custo.',
    example: '12.345.678/0001-90',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Se falso, a filial fica inativa para novos vínculos; padrão verdadeiro.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('branches')
@ApiBearerAuth()
@Controller()
export class BranchesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get('companies/:companyId/branches')
  @ApiOperation({
    summary: 'Listar filiais da empresa',
    description: 'Retorna todas as filiais cadastradas para o `companyId` informado, ordenadas por nome.',
  })
  @ApiParam({ name: 'companyId', description: 'UUID da empresa.' })
  async list(@Param('companyId') companyId: string) {
    await this.ctx.requireCompany(companyId);
    return this.prisma.branch.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  @Post('companies/:companyId/branches')
  @ApiOperation({
    summary: 'Criar filial',
    description: 'Inclui uma nova filial vinculada à empresa. Exige permissão de contexto na empresa informada.',
  })
  @ApiParam({ name: 'companyId', description: 'UUID da empresa.' })
  async create(@Param('companyId') companyId: string, @Body() dto: BranchBodyDto) {
    await this.ctx.requireCompany(companyId);
    return this.prisma.branch.create({
      data: {
        companyId,
        name: dto.name,
        legalName: dto.legalName,
        taxId: dto.taxId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Put('branches/:id')
  @ApiOperation({
    summary: 'Atualizar filial',
    description: 'Atualiza dados da filial pelo id. Retorna 404 se a filial não existir.',
  })
  @ApiParam({ name: 'id', description: 'UUID da filial.' })
  async update(@Param('id') id: string, @Body() dto: BranchBodyDto) {
    const b = await this.prisma.branch.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Filial não encontrada');
    return this.prisma.branch.update({
      where: { id },
      data: { ...dto },
    });
  }

  @Delete('branches/:id')
  @ApiOperation({
    summary: 'Excluir filial',
    description: 'Remove o registro da filial. Verifique dependências (centros de custo, logos) antes de excluir.',
  })
  @ApiParam({ name: 'id', description: 'UUID da filial.' })
  async remove(@Param('id') id: string) {
    await this.prisma.branch.delete({ where: { id } });
    return { deleted: true };
  }
}
