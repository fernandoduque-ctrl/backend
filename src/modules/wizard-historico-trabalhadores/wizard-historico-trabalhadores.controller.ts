import { Controller, Get, Put, Post, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class PensionDto {
  @ApiProperty({
    description: 'Indica se há previdência privada complementar ativa na empresa.',
    example: true,
  })
  @IsBoolean()
  hasActivePension: boolean;

  @ApiPropertyOptional({
    description: 'Observações sobre planos, operadoras ou documentação de previdência.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

class HistoricalPayrollDto {
  @ApiProperty({
    description: 'Competência do holerite no formato acordado (ex.: MM/AAAA ou AAAA-MM).',
    example: '01/2025',
  })
  @IsString()
  competence: string;

  @ApiProperty({
    description: 'UUID do arquivo de holerite já enviado via módulo de uploads.',
  })
  @IsString()
  uploadedFileId: string;

  @ApiPropertyOptional({
    description: 'Nota do usuário sobre o arquivo (contexto, divergências, etc.).',
  })
  @IsOptional()
  @IsString()
  userNote?: string;

  @ApiPropertyOptional({
    description: 'Total de proventos informado (opcional, para conferência).',
    example: 10000.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalEarnings?: number;

  @ApiPropertyOptional({
    description: 'Total de descontos informado (opcional).',
    example: 2000.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalDeductions?: number;
}

class RegistryFileDto {
  @ApiProperty({
    description: 'UUID do arquivo de registro de empregados (upload prévio).',
  })
  @IsString()
  uploadedFileId: string;

  @ApiPropertyOptional({ description: 'Nota opcional sobre o arquivo de registro.' })
  @IsOptional()
  @IsString()
  userNote?: string;
}

class TaxReliefDto {
  @ApiProperty({
    description: 'Indica se há benefício fiscal/alívio tributário aplicável à folha.',
    example: false,
  })
  @IsBoolean()
  hasTaxRelief: boolean;

  @ApiPropertyOptional({
    description: 'Detalhes do alívio ou documentação de referência.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('wizard-historico-trabalhadores')
@ApiBearerAuth()
@Controller('wizard/historico-trabalhadores')
export class WizardHistoricoTrabalhadoresController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo da etapa 3 — folha e pessoas',
    description:
      'Checklist: previdência configurada, pelo menos três holerites históricos, dependentes, arquivos de registro, ' +
      'configuração de alívio tributário e férias. Retorna também contagens auxiliares.',
  })
  async summary() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const [pension, hist, leaves, deps, reg, tax, vac] = await Promise.all([
      this.prisma.pensionConfiguration.findUnique({ where: { companyId } }),
      this.prisma.historicalPayrollFile.count({ where: { companyId } }),
      this.prisma.leaveRecord.count({ where: { companyId } }),
      this.prisma.dependentRecord.count({ where: { companyId } }),
      this.prisma.employeeRegistryFile.count({ where: { companyId } }),
      this.prisma.taxReliefConfiguration.findUnique({ where: { companyId } }),
      this.prisma.vacationRecord.count({ where: { companyId } }),
    ]);
    return {
      checklist: {
        pension: !!pension,
        historicalThreeMonths: hist >= 3,
        leavesMapped: true,
        dependents: deps > 0,
        registry: reg > 0,
        taxRelief: !!tax,
        vacations: vac > 0,
      },
      counts: { historicalPayrollFiles: hist, leaves, dependents: deps, registry: reg, vacations: vac },
    };
  }

  @Put('pension-config')
  @ApiOperation({
    summary: 'Configurar previdência complementar',
    description: 'Cria ou atualiza indicador de previdência ativa e notas explicativas.',
  })
  async pension(@Body() dto: PensionDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.pensionConfiguration.upsert({
      where: { companyId },
      create: { companyId, hasActivePension: dto.hasActivePension, notes: dto.notes },
      update: { hasActivePension: dto.hasActivePension, notes: dto.notes },
    });
  }

  @Post('historical-payroll-files')
  @ApiOperation({
    summary: 'Registrar holerite histórico',
    description: 'Vincula um arquivo de upload a uma competência e totais opcionais para conferência.',
  })
  async hist(@Body() dto: HistoricalPayrollDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.historicalPayrollFile.create({
      data: {
        companyId,
        competence: dto.competence,
        uploadedFileId: dto.uploadedFileId,
        userNote: dto.userNote,
        totalEarnings: dto.totalEarnings,
        totalDeductions: dto.totalDeductions,
      },
    });
  }

  @Post('employee-registry-files')
  @ApiOperation({
    summary: 'Registrar arquivo de registro de empregados',
    description: 'Associa upload de registro (folha de ponto, planilha, etc.) à empresa.',
  })
  async reg(@Body() dto: RegistryFileDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.employeeRegistryFile.create({
      data: {
        companyId,
        uploadedFileId: dto.uploadedFileId,
        userNote: dto.userNote,
      },
    });
  }

  @Put('tax-relief')
  @ApiOperation({
    summary: 'Configurar alívio tributário',
    description: 'Indica existência de alívio/benefício fiscal e observações.',
  })
  async tax(@Body() dto: TaxReliefDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.taxReliefConfiguration.upsert({
      where: { companyId },
      create: { companyId, hasTaxRelief: dto.hasTaxRelief, notes: dto.notes },
      update: { hasTaxRelief: dto.hasTaxRelief, notes: dto.notes },
    });
  }
}
