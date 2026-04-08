import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';
import { onlyDigits } from '../../common/utils/br-validators';

class CsvCcDto {
  @ApiProperty({
    description:
      'Texto CSV com linhas `codigo;nome` ou `codigo;nome;cnpjFilial` (somente dígitos no CNPJ). ' +
      'A primeira linha pode ser cabeçalho (`codigo;nome`). Filiais são casadas pelo CNPJ cadastrado.',
    example: 'codigo;nome;cnpjFilial\n1001;CC Matriz;\n1002;CC SP;12345678000190',
  })
  @IsString()
  csv: string;
}

class CcDto {
  @ApiProperty({ description: 'Código do centro de custo na empresa.', example: 'CC-ADM' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Nome ou descrição do centro de custo.', example: 'Administrativo' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'UUID da filial à qual o centro de custo pertence (opcional).',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Centro ativo; padrão verdadeiro.', example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@ApiTags('cost-centers')
@ApiBearerAuth()
@Controller('cost-centers')
export class CostCentersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar centros de custo',
    description: 'Retorna centros de custo da empresa em contexto com dados da filial vinculada, ordenados por código.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.costCenter.findMany({
      where: { companyId },
      include: { branch: true },
      orderBy: { code: 'asc' },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar centro de custo',
    description: 'Cria um centro de custo para a empresa atual, opcionalmente associado a uma filial.',
  })
  async create(@Body() dto: CcDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.costCenter.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        branchId: dto.branchId,
        active: dto.active ?? true,
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar centro de custo',
    description: 'Atualiza registro existente da empresa atual; retorna null se não encontrado.',
  })
  @ApiParam({ name: 'id', description: 'UUID do centro de custo.' })
  async update(@Param('id') id: string, @Body() dto: CcDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const row = await this.prisma.costCenter.findFirst({ where: { id, companyId } });
    if (!row) return null;
    return this.prisma.costCenter.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        branchId: dto.branchId,
        active: dto.active ?? true,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir centro de custo',
    description: 'Remove o centro de custo pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do centro de custo.' })
  async remove(@Param('id') id: string) {
    await this.prisma.costCenter.delete({ where: { id } });
    return { deleted: true };
  }

  @Post('import-csv')
  @ApiOperation({
    summary: 'Importar centros de custo via CSV',
    description:
      'Processa um arquivo CSV em texto: cada linha `codigo;nome` ou `codigo;nome;cnpjFilial`. ' +
      'Erros por linha são acumulados em `errors`; criados em `created`. Se nada for importado e houver erros, retorna 400.',
  })
  async importCsv(@Body() dto: CsvCcDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const branches = await this.prisma.branch.findMany({ where: { companyId } });
    const lines = dto.csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const created: unknown[] = [];
    const errors: string[] = [];
    let i = 0;
    for (const line of lines) {
      i++;
      if (/^c[oó]digo\s*;/i.test(line) || /^code\s*;/i.test(line)) continue;
      const parts = line.split(';').map((p) => p.trim());
      if (parts.length < 2) {
        errors.push(`Linha ${i}: use codigo;nome ou codigo;nome;cnpjFilial`);
        continue;
      }
      const code = parts[0];
      const name = parts[1];
      const branchTax = parts[2];
      let branchId: string | undefined;
      if (branchTax) {
        const d = onlyDigits(branchTax);
        const b = branches.find((br) => onlyDigits(br.taxId || '') === d);
        branchId = b?.id;
        if (!branchId) {
          errors.push(`Linha ${i}: CNPJ de filial não encontrado: ${branchTax}`);
          continue;
        }
      }
      try {
        const row = await this.prisma.costCenter.create({
          data: { companyId, code, name, branchId, active: true },
        });
        created.push(row);
      } catch (e) {
        errors.push(`Linha ${i}: ${(e as Error).message}`);
      }
    }
    if (!created.length && errors.length) {
      throw new BadRequestException({ message: 'Nenhum centro de custo importado', errors });
    }
    return { created, errors };
  }
}
