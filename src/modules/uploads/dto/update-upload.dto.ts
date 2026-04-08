import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUploadDto {
  @ApiPropertyOptional({
    description:
      'Marca o arquivo como ilegível ou de baixa qualidade para revisão humana (ex.: documento escaneado ilegível).',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  illegible?: boolean;

  @ApiPropertyOptional({
    description:
      'Observação livre do usuário sobre o arquivo (contexto, competência, problemas encontrados).',
    example: 'Holerite de competência 01/2025 — conferido pelo DP.',
  })
  @IsOptional()
  @IsString()
  userNote?: string;
}
