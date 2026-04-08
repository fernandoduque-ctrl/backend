import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description:
      'Nome fantasia ou nome pelo qual o cliente deseja ser identificado na aplicação (mínimo 3 caracteres).',
    minLength: 3,
    example: 'Minha Empresa Ltda',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  clientDisplayName?: string;

  @ApiPropertyOptional({
    description: 'Razão social completa conforme registro na Receita Federal.',
    example: 'Minha Empresa Comércio e Serviços Ltda',
  })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({
    description: 'CNPJ da matriz (com ou sem máscara; o backend pode normalizar dígitos).',
    example: '12.345.678/0001-90',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'E-mail principal de contato da empresa para comunicações do projeto.',
    example: 'contato@empresa.com.br',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato (formato livre; recomenda-se DDD + número).',
    example: '(11) 98765-4321',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description:
      'Indica se a empresa possui filiais além da matriz. Afeta o fluxo do assistente e cadastro de CNPJs de filial.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  hasBranches?: boolean;

  @ApiPropertyOptional({
    description:
      'Se verdadeiro, permite logotipos distintos por filial; caso contrário, usa identidade visual única da matriz.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  hasDifferentBranchLogos?: boolean;
}

export class CreateCompanyDto extends UpdateCompanyDto {
  @ApiProperty({
    description:
      'Obrigatório na criação: nome de exibição do cliente na plataforma (mínimo 3 caracteres).',
    minLength: 3,
    example: 'Novo Cliente SA',
  })
  @IsString()
  @MinLength(3)
  clientDisplayName: string;
}
