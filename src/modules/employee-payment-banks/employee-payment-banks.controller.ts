import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class EpbDto {
  @ApiProperty({
    description: 'UUID do registro em `bankReference` (código FEBRABAN) selecionado para pagamento.',
  })
  @IsString()
  bankReferenceId: string;

  @ApiProperty({
    description: 'Número da agência bancária (sem dígito verificador se enviado separado).',
    example: '1234',
  })
  @IsString()
  agency: string;

  @ApiPropertyOptional({
    description: 'Dígito verificador da agência, quando existir.',
    example: '5',
  })
  @IsOptional()
  @IsString()
  agencyDigit?: string;

  @ApiProperty({
    description:
      'Tipo de conta para folha (texto livre conforme convenção interna: ex. CORRENTE, POUPANCA, SALARIO).',
    example: 'CORRENTE',
  })
  @IsString()
  accountType: string;
}

@ApiTags('employee-payment-banks')
@ApiBearerAuth()
@Controller('employee-payment-banks')
export class EmployeePaymentBanksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar bancos de pagamento de salários',
    description:
      'Lista contas/agências cadastradas para a empresa pagar salários, com objeto `bankReference` expandido.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.employeePaymentBank.findMany({
      where: { companyId },
      include: { bankReference: true },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Cadastrar banco de pagamento',
    description: 'Inclui uma combinação banco + agência + tipo de conta usada na folha.',
  })
  async create(@Body() dto: EpbDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.employeePaymentBank.create({
      data: {
        companyId,
        bankReferenceId: dto.bankReferenceId,
        agency: dto.agency,
        agencyDigit: dto.agencyDigit,
        accountType: dto.accountType,
      },
      include: { bankReference: true },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar banco de pagamento',
    description: 'Atualiza registro da empresa; retorna null se id não for da empresa atual.',
  })
  @ApiParam({ name: 'id', description: 'UUID do registro employeePaymentBank.' })
  async update(@Param('id') id: string, @Body() dto: EpbDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const row = await this.prisma.employeePaymentBank.findFirst({ where: { id, companyId } });
    if (!row) return null;
    return this.prisma.employeePaymentBank.update({
      where: { id },
      data: { ...dto },
      include: { bankReference: true },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir banco de pagamento',
    description: 'Remove o registro pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do registro employeePaymentBank.' })
  async remove(@Param('id') id: string) {
    await this.prisma.employeePaymentBank.delete({ where: { id } });
    return { deleted: true };
  }
}
