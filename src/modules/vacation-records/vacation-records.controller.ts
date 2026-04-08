import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class VacDto {
  @ApiProperty({
    description: 'Nome do colaborador (identificação simplificada neste MVP; não é UUID de funcionário).',
    example: 'Maria Souza',
  })
  @IsString()
  employeeName: string;

  @ApiProperty({
    description: 'Início do período aquisitivo (ISO 8601 data).',
    example: '2023-01-01',
  })
  @IsDateString()
  accrualStartDate: string;

  @ApiProperty({
    description: 'Fim do período aquisitivo (ISO 8601 data).',
    example: '2023-12-31',
  })
  @IsDateString()
  accrualEndDate: string;

  @ApiPropertyOptional({
    description: 'Dias de férias já gozados no período; padrão 0.',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  takenDays?: number;

  @ApiPropertyOptional({
    description: 'Dias de férias ainda pendentes; padrão 0.',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pendingDays?: number;
}

@ApiTags('vacation-records')
@ApiBearerAuth()
@Controller('vacation-records')
export class VacationRecordsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar registros de férias',
    description: 'Lista controles simplificados de férias por colaborador (nome) da empresa atual.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.vacationRecord.findMany({ where: { companyId } });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar registro de férias',
    description: 'Inclui período aquisitivo e contagem de dias gozados/pendentes.',
  })
  async create(@Body() dto: VacDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.vacationRecord.create({
      data: {
        companyId,
        employeeName: dto.employeeName,
        accrualStartDate: new Date(dto.accrualStartDate),
        accrualEndDate: new Date(dto.accrualEndDate),
        takenDays: dto.takenDays ?? 0,
        pendingDays: dto.pendingDays ?? 0,
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar registro de férias',
    description: 'Substitui dados do registro pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do registro de férias.' })
  async update(@Param('id') id: string, @Body() dto: VacDto) {
    return this.prisma.vacationRecord.update({
      where: { id },
      data: {
        employeeName: dto.employeeName,
        accrualStartDate: new Date(dto.accrualStartDate),
        accrualEndDate: new Date(dto.accrualEndDate),
        takenDays: dto.takenDays ?? 0,
        pendingDays: dto.pendingDays ?? 0,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir registro de férias',
    description: 'Remove o registro pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do registro de férias.' })
  async remove(@Param('id') id: string) {
    await this.prisma.vacationRecord.delete({ where: { id } });
    return { deleted: true };
  }
}
