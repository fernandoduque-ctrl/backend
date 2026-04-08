import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RubricType } from '../../common/prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class RubricDto {
  @ApiProperty({ description: 'Código único da rubrica na empresa.', example: '001' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Nome ou descrição da rubrica na folha.', example: 'Salário base' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: RubricType,
    enumName: 'RubricType',
    description:
      '`EARNING`: provento. `DEDUCTION`: desconto. `INFORMATIVE`: informativa (sem impacto direto em líquido).',
    example: RubricType.EARNING,
  })
  @IsEnum(RubricType)
  rubricType: RubricType;

  @ApiPropertyOptional({
    description: 'Natureza contábil ou classificação auxiliar (texto livre conforme processo do cliente).',
  })
  @IsOptional()
  @IsString()
  nature?: string;

  @ApiPropertyOptional({ description: 'Incide sobre base de INSS.', example: true })
  @IsOptional()
  @IsBoolean()
  incidenceINSS?: boolean;

  @ApiPropertyOptional({ description: 'Incide sobre base de FGTS.', example: true })
  @IsOptional()
  @IsBoolean()
  incidenceFGTS?: boolean;

  @ApiPropertyOptional({ description: 'Incide sobre base de IRRF.', example: true })
  @IsOptional()
  @IsBoolean()
  incidenceIRRF?: boolean;

  @ApiPropertyOptional({ description: 'Incide para fins de eSocial.', example: true })
  @IsOptional()
  @IsBoolean()
  incidenceESocial?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de recorrência (ex.: MONTHLY). Padrão MONTHLY se omitido.',
    example: 'MONTHLY',
  })
  @IsOptional()
  @IsString()
  recurrenceType?: string;

  @ApiPropertyOptional({
    description: 'UUID do centro de custo sugerido ao lançar a rubrica.',
  })
  @IsOptional()
  @IsString()
  defaultCostCenterId?: string;

  @ApiPropertyOptional({
    description: 'UUID do departamento sugerido ao lançar a rubrica.',
  })
  @IsOptional()
  @IsString()
  defaultDepartmentId?: string;

  @ApiPropertyOptional({ description: 'Rubrica ativa; padrão verdadeiro.', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class ImportRowDto {
  @ApiProperty({ description: 'Código da rubrica a importar.', example: '500' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Nome da rubrica.', example: 'Horas extras 50%' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: RubricType,
    enumName: 'RubricType',
    description: 'Tipo da rubrica importada.',
    example: RubricType.EARNING,
  })
  @IsEnum(RubricType)
  rubricType: RubricType;
}

class ImportDto {
  @ApiProperty({
    type: [ImportRowDto],
    description:
      'Lista de rubricas a criar. Códigos já existentes na empresa são ignorados e listados em `skipped` na resposta.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportRowDto)
  rows: ImportRowDto[];
}

@ApiTags('payroll-rubrics')
@ApiBearerAuth()
@Controller('payroll-rubrics')
export class PayrollRubricsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar rubricas',
    description:
      'Lista rubricas de folha da empresa em contexto com centro de custo e departamento padrão resolvidos.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.payrollRubric.findMany({
      where: { companyId },
      include: { defaultCostCenter: true, defaultDepartment: true },
      orderBy: { code: 'asc' },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar rubrica',
    description: 'Cria uma rubrica com incidências e padrões de centro/departamento.',
  })
  async create(@Body() dto: RubricDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.payrollRubric.create({
      data: {
        companyId,
        code: dto.code.trim(),
        name: dto.name,
        rubricType: dto.rubricType,
        nature: dto.nature,
        incidenceINSS: dto.incidenceINSS ?? false,
        incidenceFGTS: dto.incidenceFGTS ?? false,
        incidenceIRRF: dto.incidenceIRRF ?? false,
        incidenceESocial: dto.incidenceESocial ?? false,
        recurrenceType: dto.recurrenceType ?? 'MONTHLY',
        defaultCostCenterId: dto.defaultCostCenterId,
        defaultDepartmentId: dto.defaultDepartmentId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar rubrica',
    description: 'Atualiza rubrica existente da empresa; retorna null se não encontrada.',
  })
  @ApiParam({ name: 'id', description: 'UUID da rubrica.' })
  async update(@Param('id') id: string, @Body() dto: RubricDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const row = await this.prisma.payrollRubric.findFirst({ where: { id, companyId } });
    if (!row) return null;
    return this.prisma.payrollRubric.update({
      where: { id },
      data: {
        code: dto.code.trim(),
        name: dto.name,
        rubricType: dto.rubricType,
        nature: dto.nature,
        incidenceINSS: dto.incidenceINSS ?? false,
        incidenceFGTS: dto.incidenceFGTS ?? false,
        incidenceIRRF: dto.incidenceIRRF ?? false,
        incidenceESocial: dto.incidenceESocial ?? false,
        recurrenceType: dto.recurrenceType ?? 'MONTHLY',
        defaultCostCenterId: dto.defaultCostCenterId,
        defaultDepartmentId: dto.defaultDepartmentId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir rubrica',
    description: 'Remove a rubrica pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID da rubrica.' })
  async remove(@Param('id') id: string) {
    await this.prisma.payrollRubric.delete({ where: { id } });
    return { deleted: true };
  }

  @Post('import')
  @ApiOperation({
    summary: 'Importar rubricas em lote',
    description:
      'Cria rubricas em massa; códigos duplicados na empresa são pulados (retornados em `skipped`). Corpo vazio gera 400.',
  })
  async importRows(@Body() dto: ImportDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    if (!dto.rows?.length) throw new BadRequestException('Nenhuma linha');
    const created: unknown[] = [];
    const skipped: string[] = [];
    for (const r of dto.rows) {
      const exists = await this.prisma.payrollRubric.findUnique({
        where: { companyId_code: { companyId, code: r.code.trim() } },
      });
      if (exists) {
        skipped.push(r.code);
        continue;
      }
      const row = await this.prisma.payrollRubric.create({
        data: {
          companyId,
          code: r.code.trim(),
          name: r.name,
          rubricType: r.rubricType,
          isActive: true,
        },
      });
      created.push(row);
    }
    return { created, skipped };
  }
}
