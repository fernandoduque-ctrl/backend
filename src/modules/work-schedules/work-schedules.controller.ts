import { BadRequestException, Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { JourneyType } from '../../common/prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';

class CsvImportDto {
  @ApiProperty({
    description:
      'CSV com linhas: `nome;journeyType;entrada;saida;intervaloMin;dias` (dias: lista 0–6 separada por vírgula ou pipe). ' +
      '`journeyType`: FIXED ou SHIFT. Primeira linha pode ser cabeçalho `nome;...`.',
    example: 'nome;journey;entrada;saida;intervalo;dias\nEquipe A;FIXED;08:00;17:00;60;1,2,3,4,5',
  })
  @IsString()
  csv: string;
}

class WsDto {
  @ApiProperty({ description: 'Nome da jornada (turno ou escala).', example: 'Administrativo 8h' })
  @IsString()
  name: string;

  @ApiProperty({
    enum: JourneyType,
    enumName: 'JourneyType',
    description:
      '`FIXED`: horário fixo diário. `SHIFT`: escala/outro regime (campos de horário podem variar conforme uso).',
    example: JourneyType.FIXED,
  })
  @IsEnum(JourneyType)
  journeyType: JourneyType;

  @ApiPropertyOptional({
    description: 'Horário de início (string livre, ex.: HH:mm), quando aplicável.',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Horário de término (string livre), quando aplicável.',
    example: '17:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Duração do intervalo intrajornada em minutos.',
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;

  @ApiPropertyOptional({
    description: 'Sugestão textual de descanso semanal (campo informativo).',
  })
  @IsOptional()
  @IsString()
  weeklyRestSuggestion?: string;

  @ApiPropertyOptional({
    description: 'Carga horária diária em minutos (quando utilizado pelo cadastro).',
    example: 480,
  })
  @IsOptional()
  @IsInt()
  workloadDailyMinutes?: number;

  @ApiPropertyOptional({ description: 'Jornada ativa; padrão verdadeiro.', example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description:
      'Dias da semana em que a jornada se aplica: 0 = domingo … 6 = sábado. Substitui vínculos anteriores no update.',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  weekdays?: number[];
}

@ApiTags('work-schedules')
@ApiBearerAuth()
@Controller('work-schedules')
export class WorkSchedulesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar jornadas',
    description: 'Lista jornadas de trabalho da empresa em contexto com os dias da semana associados.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.workSchedule.findMany({
      where: { companyId },
      include: { weekdays: true },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar jornada',
    description: 'Cria jornada e, opcionalmente, registros de dias da semana (`weekdays`).',
  })
  async create(@Body() dto: WsDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const { weekdays, ...rest } = dto;
    const ws = await this.prisma.workSchedule.create({
      data: {
        companyId,
        ...rest,
        breakMinutes: dto.breakMinutes ?? 0,
        active: dto.active ?? true,
      },
    });
    if (weekdays?.length) {
      const uniqueDays = [...new Set(weekdays)];
      await this.prisma.workScheduleWeekday.createMany({
        data: uniqueDays.map((weekday) => ({ workScheduleId: ws.id, weekday })),
      });
    }
    return this.prisma.workSchedule.findUnique({
      where: { id: ws.id },
      include: { weekdays: true },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar jornada',
    description:
      'Atualiza campos da jornada. Se `weekdays` for enviado, substitui todos os vínculos de dias da semana.',
  })
  @ApiParam({ name: 'id', description: 'UUID da jornada.' })
  async update(@Param('id') id: string, @Body() dto: WsDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const existing = await this.prisma.workSchedule.findFirst({ where: { id, companyId } });
    if (!existing) return null;
    const { weekdays, ...rest } = dto;
    await this.prisma.workSchedule.update({
      where: { id },
      data: rest,
    });
    if (weekdays) {
      await this.prisma.workScheduleWeekday.deleteMany({ where: { workScheduleId: id } });
      await this.prisma.workScheduleWeekday.createMany({
        data: weekdays.map((weekday) => ({ workScheduleId: id, weekday })),
      });
    }
    return this.prisma.workSchedule.findUnique({
      where: { id },
      include: { weekdays: true },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir jornada',
    description: 'Remove a jornada e seus vínculos de dias (cascade conforme schema).',
  })
  @ApiParam({ name: 'id', description: 'UUID da jornada.' })
  async remove(@Param('id') id: string) {
    await this.prisma.workSchedule.delete({ where: { id } });
    return { deleted: true };
  }

  @Post('import-csv')
  @ApiOperation({
    summary: 'Importar jornadas via CSV',
    description:
      'Cria várias jornadas a partir de texto CSV. Formato por linha: nome;journeyType;entrada;saida;intervaloMin;dias.',
  })
  async importCsv(@Body() dto: CsvImportDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const lines = dto.csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const created: unknown[] = [];
    const errors: string[] = [];
    let i = 0;
    for (const line of lines) {
      i++;
      if (/^nome\s*;/i.test(line) || /^name\s*;/i.test(line)) continue;
      const parts = line.split(';').map((p) => p.trim());
      if (parts.length < 6) {
        errors.push(`Linha ${i}: esperado nome;journey;entrada;saida;intervalo;dias`);
        continue;
      }
      const [name, jt, startTime, endTime, breakStr, daysStr] = parts;
      const journeyType = jt === 'SHIFT' ? JourneyType.SHIFT : JourneyType.FIXED;
      const breakMinutes = parseInt(breakStr, 10) || 0;
      const weekdays = daysStr
        .split(/[,|]/)
        .map((d) => parseInt(d.trim(), 10))
        .filter((n) => n >= 0 && n <= 6);
      try {
        const ws = await this.prisma.workSchedule.create({
          data: {
            companyId,
            name,
            journeyType,
            startTime,
            endTime,
            breakMinutes,
            active: true,
          },
        });
        if (weekdays.length) {
          const uniqueDays = [...new Set(weekdays)];
          await this.prisma.workScheduleWeekday.createMany({
            data: uniqueDays.map((weekday) => ({ workScheduleId: ws.id, weekday })),
          });
        }
        created.push(
          await this.prisma.workSchedule.findUnique({
            where: { id: ws.id },
            include: { weekdays: true },
          }),
        );
      } catch (e) {
        errors.push(`Linha ${i}: ${(e as Error).message}`);
      }
    }
    if (!created.length && errors.length) {
      throw new BadRequestException({ message: 'Nenhuma linha importada', errors });
    }
    return { created, errors };
  }
}
