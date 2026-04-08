import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class LeaveDto {
  @ApiProperty({
    description: 'Nome do colaborador afastado (identificação textual neste MVP).',
    example: 'Carlos Pereira',
  })
  @IsString()
  employeeName: string;

  @ApiProperty({
    description: 'Tipo de afastamento/licença (texto ou código interno: médico, maternidade, etc.).',
    example: 'ATESTADO_MEDICO',
  })
  @IsString()
  leaveType: string;

  @ApiProperty({
    description: 'Data de início do afastamento (ISO 8601).',
    example: '2025-02-01',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    description: 'Previsão de retorno (ISO 8601), se conhecida.',
    example: '2025-02-15',
  })
  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @ApiPropertyOptional({
    description: 'Origem do registro; padrão MANUAL se omitido (ex.: MANUAL, IMPORT).',
    example: 'MANUAL',
  })
  @IsOptional()
  @IsString()
  sourceType?: string;
}

@ApiTags('leave-records')
@ApiBearerAuth()
@Controller('leave-records')
export class LeaveRecordsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar afastamentos',
    description: 'Lista registros de licença/afastamento da empresa em contexto.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.leaveRecord.findMany({ where: { companyId } });
  }

  @Post()
  @ApiOperation({
    summary: 'Registrar afastamento',
    description: 'Cria registro com datas e tipo; `sourceType` default MANUAL.',
  })
  async create(@Body() dto: LeaveDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.leaveRecord.create({
      data: {
        companyId,
        employeeName: dto.employeeName,
        leaveType: dto.leaveType,
        startDate: new Date(dto.startDate),
        expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
        sourceType: dto.sourceType ?? 'MANUAL',
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar afastamento',
    description: 'Atualiza campos do registro pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do registro de afastamento.' })
  async update(@Param('id') id: string, @Body() dto: LeaveDto) {
    return this.prisma.leaveRecord.update({
      where: { id },
      data: {
        employeeName: dto.employeeName,
        leaveType: dto.leaveType,
        startDate: new Date(dto.startDate),
        expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
        sourceType: dto.sourceType ?? 'MANUAL',
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir afastamento',
    description: 'Remove o registro pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do registro de afastamento.' })
  async remove(@Param('id') id: string) {
    await this.prisma.leaveRecord.delete({ where: { id } });
    return { deleted: true };
  }
}
