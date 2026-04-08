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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BenefitPaymentRuleType,
  BenefitType,
  BenefitValueType,
} from '../../common/prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class BenefitDto {
  @ApiProperty({
    enum: BenefitType,
    enumName: 'BenefitType',
    description: 'Tipo de benefício (vale-refeição, VT, plano de saúde, etc.).',
    example: BenefitType.MEAL_VOUCHER,
  })
  @IsEnum(BenefitType)
  type: BenefitType;

  @ApiProperty({
    description: 'Nome interno do benefício para identificação na empresa.',
    example: 'VR padrão',
  })
  @IsString()
  internalName: string;

  @ApiProperty({
    enum: BenefitPaymentRuleType,
    enumName: 'BenefitPaymentRuleType',
    description:
      'Quem paga: empresa 100%, colaborador 100% ou rateio percentual (`SPLIT_PERCENT` exige soma 100% titular).',
    example: BenefitPaymentRuleType.COMPANY_100,
  })
  @IsEnum(BenefitPaymentRuleType)
  paymentRuleType: BenefitPaymentRuleType;

  @ApiPropertyOptional({
    description:
      'Percentual pago pela empresa quando `paymentRuleType` é SPLIT_PERCENT (titular). Deve somar 100% com `employeePercentage`.',
    example: 80,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  companyPercentage?: number;

  @ApiPropertyOptional({
    description: 'Percentual pago pelo colaborador no rateio titular; complemento de `companyPercentage`.',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  employeePercentage?: number;

  @ApiPropertyOptional({
    description: 'Se verdadeiro, habilita percentuais específicos para dependentes.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hasDependents?: boolean;

  @ApiPropertyOptional({
    description: 'Percentual empresa sobre dependentes (soma 100% com `dependentEmployeePercentage` se hasDependents).',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dependentCompanyPercentage?: number;

  @ApiPropertyOptional({
    description: 'Percentual colaborador sobre dependentes.',
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dependentEmployeePercentage?: number;

  @ApiProperty({
    enum: BenefitValueType,
    enumName: 'BenefitValueType',
    description: '`DAILY`: valor por dia útil. `MONTHLY_FIXED`: valor fixo mensal.',
    example: BenefitValueType.MONTHLY_FIXED,
  })
  @IsEnum(BenefitValueType)
  valueType: BenefitValueType;

  @ApiPropertyOptional({
    description: 'Valor padrão numérico conforme `valueType` (interpretação de moeda no front).',
    example: 550.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  defaultValue?: number;

  @ApiPropertyOptional({
    description:
      'Para VT: percentual de desconto permitido no salário (máx. 6% conforme regra CLT citada na validação).',
    example: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  transportDiscountPercent?: number;

  @ApiPropertyOptional({ description: 'Benefício ativo; padrão verdadeiro.', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Confirmação de ciência das regras do benefício (checkbox legal/compliance no fluxo do assistente).',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  understoodAck?: boolean;
}

@ApiTags('benefits')
@ApiBearerAuth()
@Controller('benefits')
export class BenefitsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  private validateBenefit(dto: BenefitDto) {
    if (dto.paymentRuleType === BenefitPaymentRuleType.SPLIT_PERCENT) {
      const a = Number(dto.companyPercentage ?? 0);
      const b = Number(dto.employeePercentage ?? 0);
      if (Math.abs(a + b - 100) > 0.001) {
        throw new BadRequestException('Rateio titular deve somar 100%.');
      }
    }
    if (dto.hasDependents) {
      const ac = Number(dto.dependentCompanyPercentage ?? 0);
      const ae = Number(dto.dependentEmployeePercentage ?? 0);
      if (Math.abs(ac + ae - 100) > 0.001) {
        throw new BadRequestException('Rateio dependentes deve somar 100%.');
      }
    }
    if (dto.type === BenefitType.TRANSPORT_VOUCHER && dto.transportDiscountPercent != null) {
      const p = Number(dto.transportDiscountPercent);
      if (p > 6) {
        throw new BadRequestException(
          'Percentual de desconto do VT acima de 6% — verifique acordo coletivo e regras internas (CLT art. 58 §3º).',
        );
      }
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Listar benefícios',
    description: 'Lista benefícios parametrizados da empresa com fornecedores vinculados.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.benefit.findMany({
      where: { companyId },
      include: { suppliers: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar benefício',
    description:
      'Cria benefício com validação de rateios e limite de desconto de VT. Fornecedores são cadastrados em `benefit-suppliers`.',
  })
  async create(@Body() dto: BenefitDto) {
    this.validateBenefit(dto);
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.benefit.create({
      data: {
        companyId,
        type: dto.type,
        internalName: dto.internalName,
        paymentRuleType: dto.paymentRuleType,
        companyPercentage: dto.companyPercentage,
        employeePercentage: dto.employeePercentage,
        hasDependents: dto.hasDependents ?? false,
        dependentCompanyPercentage: dto.dependentCompanyPercentage,
        dependentEmployeePercentage: dto.dependentEmployeePercentage,
        valueType: dto.valueType,
        defaultValue: dto.defaultValue,
        transportDiscountPercent: dto.transportDiscountPercent,
        isActive: dto.isActive ?? true,
        understoodAck: dto.understoodAck ?? false,
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar benefício',
    description: 'Atualiza benefício existente; retorna null se não pertencer à empresa.',
  })
  @ApiParam({ name: 'id', description: 'UUID do benefício.' })
  async update(@Param('id') id: string, @Body() dto: BenefitDto) {
    this.validateBenefit(dto);
    const companyId = await this.ctx.getCurrentCompanyId();
    const row = await this.prisma.benefit.findFirst({ where: { id, companyId } });
    if (!row) return null;
    const split = dto.paymentRuleType === BenefitPaymentRuleType.SPLIT_PERCENT;
    const deps = dto.hasDependents === true;
    return this.prisma.benefit.update({
      where: { id },
      data: {
        type: dto.type,
        internalName: dto.internalName,
        paymentRuleType: dto.paymentRuleType,
        companyPercentage: split ? dto.companyPercentage ?? null : null,
        employeePercentage: split ? dto.employeePercentage ?? null : null,
        hasDependents: dto.hasDependents ?? false,
        dependentCompanyPercentage: deps ? dto.dependentCompanyPercentage ?? null : null,
        dependentEmployeePercentage: deps ? dto.dependentEmployeePercentage ?? null : null,
        valueType: dto.valueType,
        defaultValue: dto.defaultValue,
        transportDiscountPercent: dto.transportDiscountPercent,
        isActive: dto.isActive ?? true,
        understoodAck: dto.understoodAck ?? false,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir benefício',
    description: 'Remove o benefício; avalie fornecedores e arquivos vinculados antes.',
  })
  @ApiParam({ name: 'id', description: 'UUID do benefício.' })
  async remove(@Param('id') id: string) {
    await this.prisma.benefit.delete({ where: { id } });
    return { deleted: true };
  }
}
