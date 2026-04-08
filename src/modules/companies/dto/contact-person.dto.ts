import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpsertContactPersonDto {
  @ApiProperty({
    description: 'Nome completo da pessoa de contato responsável pela parametrização junto à Sólides.',
    example: 'Maria Silva',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'CPF da pessoa de contato (validado quando informado).',
    example: '123.456.789-00',
  })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({
    description: 'E-mail direto da pessoa de contato (pode coincidir com o e-mail da empresa).',
    example: 'maria.silva@empresa.com.br',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Telefone da pessoa de contato.',
    example: '(11) 91234-5678',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
