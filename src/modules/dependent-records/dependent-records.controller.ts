import { BadRequestException, Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
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
import { isValidCPF, onlyDigits } from '../../common/utils/br-validators';

class DepDto {
  @ApiProperty({
    description: 'Nome completo do dependente como consta em documentos.',
    example: 'João Silva',
  })
  @IsString()
  dependentName: string;

  @ApiPropertyOptional({
    description: 'CPF do dependente (validado quando informado).',
    example: '123.456.789-00',
  })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiProperty({
    description:
      'Tipo de dependência para IR/benefícios (código ou rótulo conforme processo interno: filho, cônjuge, etc.).',
    example: 'FILHO',
  })
  @IsString()
  dependencyType: string;

  @ApiPropertyOptional({
    description: 'Nome da mãe do dependente (útil para conferência cadastral).',
  })
  @IsOptional()
  @IsString()
  motherName?: string;

  @ApiPropertyOptional({
    description: 'Data de nascimento em ISO 8601 (somente data).',
    example: '2015-03-20',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

@ApiTags('dependent-records')
@ApiBearerAuth()
@Controller('dependent-records')
export class DependentRecordsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar dependentes',
    description: 'Lista registros de dependentes da empresa em contexto.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.dependentRecord.findMany({ where: { companyId } });
  }

  @Post()
  @ApiOperation({
    summary: 'Incluir dependente',
    description: 'Cria registro de dependente com validação de CPF quando preenchido.',
  })
  async create(@Body() dto: DepDto) {
    if (dto.cpf && !isValidCPF(dto.cpf)) {
      throw new BadRequestException('CPF do dependente inválido');
    }
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.dependentRecord.create({
      data: {
        companyId,
        dependentName: dto.dependentName,
        cpf: dto.cpf ? onlyDigits(dto.cpf) : dto.cpf,
        dependencyType: dto.dependencyType,
        motherName: dto.motherName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar dependente',
    description: 'Atualiza dados do dependente pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do registro de dependente.' })
  async update(@Param('id') id: string, @Body() dto: DepDto) {
    if (dto.cpf && !isValidCPF(dto.cpf)) {
      throw new BadRequestException('CPF do dependente inválido');
    }
    return this.prisma.dependentRecord.update({
      where: { id },
      data: {
        dependentName: dto.dependentName,
        cpf: dto.cpf ? onlyDigits(dto.cpf) : dto.cpf,
        dependencyType: dto.dependencyType,
        motherName: dto.motherName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir dependente',
    description: 'Remove o registro pelo id.',
  })
  @ApiParam({ name: 'id', description: 'UUID do registro de dependente.' })
  async remove(@Param('id') id: string) {
    await this.prisma.dependentRecord.delete({ where: { id } });
    return { deleted: true };
  }
}
