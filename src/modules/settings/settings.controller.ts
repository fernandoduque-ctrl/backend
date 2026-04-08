import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';

class SettingsDto {
  @ApiProperty({
    description:
      'Objeto JSON livre com parâmetros da aplicação (preferências globais). ' +
      'É serializado e armazenado como texto no registro único `default`.',
    example: { theme: 'light', features: { betaReports: false } },
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  data: Record<string, unknown>;
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Obter configurações globais',
    description:
      'Lê o registro de configurações da aplicação (id `default`). Se inexistente ou JSON inválido, retorna `{ data: {} }`.',
  })
  async get() {
    const row = await this.prisma.appSettings.findUnique({ where: { id: 'default' } });
    if (!row) {
      return { data: {} };
    }
    try {
      return { data: JSON.parse(row.dataJson) as Record<string, unknown> };
    } catch {
      return { data: {} };
    }
  }

  @Put()
  @ApiOperation({
    summary: 'Salvar configurações globais',
    description:
      'Substitui o JSON de configurações globais (upsert no id `default`). Cuidado: afeta todos os usuários da instalação.',
  })
  async put(@Body() dto: SettingsDto) {
    const dataJson = JSON.stringify(dto.data);
    return this.prisma.appSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', dataJson },
      update: { dataJson },
    });
  }
}
