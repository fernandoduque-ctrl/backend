import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class DeptDto {
  @ApiProperty({
    description: 'Código curto do departamento (único no contexto da empresa), usado em integrações e relatórios.',
    example: 'DP01',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Nome legível do departamento ou setor.',
    example: 'Departamento Pessoal',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'UUID do centro de custo padrão vinculado ao departamento, se houver.',
  })
  @IsOptional()
  @IsString()
  costCenterId?: string;

  @ApiPropertyOptional({
    description: 'Indica se o departamento está ativo; padrão verdadeiro.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar departamentos',
    description:
      'Lista departamentos da empresa em contexto com o centro de custo relacionado (quando existir), ordenados por código.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.department.findMany({
      where: { companyId },
      include: { costCenter: true },
      orderBy: { code: 'asc' },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar departamento',
    description: 'Cria um departamento na empresa atual, opcionalmente ligado a um centro de custo.',
  })
  async create(@Body() dto: DeptDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.department.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        costCenterId: dto.costCenterId,
        active: dto.active ?? true,
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar departamento',
    description: 'Atualiza departamento existente da empresa atual. Retorna null se o id não pertencer à empresa.',
  })
  @ApiParam({ name: 'id', description: 'UUID do departamento.' })
  async update(@Param('id') id: string, @Body() dto: DeptDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const row = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!row) return null;
    return this.prisma.department.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        costCenterId: dto.costCenterId,
        active: dto.active ?? true,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir departamento',
    description: 'Remove o departamento pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do departamento.' })
  async remove(@Param('id') id: string) {
    await this.prisma.department.delete({ where: { id } });
    return { deleted: true };
  }
}
