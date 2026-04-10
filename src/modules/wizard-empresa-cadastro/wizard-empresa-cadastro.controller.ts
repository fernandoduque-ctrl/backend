import { BadRequestException, Controller, Get, Put, Post, Body } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { LogoScope } from '../../common/prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';
import {
  isValidCPF,
  isValidCNPJ,
  isValidLegalName,
  onlyDigits,
  suggestEmailFix,
} from '../../common/utils/br-validators';

class ClientDto {
  @ApiProperty({
    description: 'Nome fantasia ou identificação curta do cliente na plataforma (mín. 3 caracteres).',
    example: 'Empresa Exemplo',
  })
  @IsString()
  @MinLength(3)
  clientDisplayName: string;
}

class MatrixDto {
  @ApiProperty({
    description: 'Razão social da matriz; validada quanto a caracteres permitidos.',
    example: 'Empresa Exemplo Comércio Ltda',
  })
  @IsString()
  legalName: string;

  @ApiPropertyOptional({
    description: 'CNPJ da matriz; quando 14 dígitos, validado como CNPJ.',
    example: '12.345.678/0001-90',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiProperty({
    description: 'Nome do responsável legal ou contato principal na parametrização.',
    example: 'Ana Costa',
  })
  @IsString()
  responsibleName: string;

  @ApiPropertyOptional({
    description: 'CPF do responsável (validado quando informado).',
    example: '123.456.789-00',
  })
  @IsOptional()
  @IsString()
  responsibleCpf?: string;

  @ApiProperty({
    description: 'Telefone de contato da empresa.',
    example: '(11) 3456-7890',
  })
  @IsString()
  contactPhone: string;

  @ApiProperty({
    description: 'E-mail de contato; o sistema pode sugerir correção de domínio comum.',
    example: 'contato@empresa.com.br',
  })
  @IsEmail()
  contactEmail: string;
}

class BranchesConfigDto {
  @ApiProperty({
    description: 'Informa se a empresa possui filiais além da matriz (afeta cadastro de CNPJs de filial).',
    example: true,
  })
  @IsBoolean()
  hasBranches: boolean;
}

class BrandingDto {
  @ApiProperty({
    description: 'Se verdadeiro, espera-se logotipo por filial; se falso, identidade única da matriz.',
    example: false,
  })
  @IsBoolean()
  hasDifferentBranchLogos: boolean;
}

class LogoLinkDto {
  @ApiProperty({
    description: 'UUID do arquivo já enviado via POST /uploads que será associado como logo.',
  })
  @IsString()
  uploadedFileId: string;

  @ApiProperty({
    enum: LogoScope,
    enumName: 'LogoScope',
    description: '`COMPANY`: logo da matriz. `BRANCH`: logo de filial (informar `branchId`).',
    example: LogoScope.COMPANY,
  })
  @IsEnum(LogoScope)
  scope: LogoScope;

  @ApiPropertyOptional({
    description: 'Obrigatório quando `scope` é BRANCH: UUID da filial.',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}

class BranchCreateDto {
  @ApiProperty({ description: 'Nome da nova filial.', example: 'Filial Rio' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Razão social da filial, se diferente.' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({
    description: 'CNPJ da filial; não pode duplicar outro da mesma empresa.',
    example: '98.765.432/0001-10',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Filial ativa; padrão verdadeiro.', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@ApiTags('wizard-empresa-cadastro')
@ApiBearerAuth()
@Controller('wizard/empresa-cadastro')
export class WizardEmpresaCadastroController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obter dados da etapa 1',
    description:
      'Retorna empresa com contato e filiais, além dos vínculos de logo com arquivos e filial (quando houver).',
  })
  async get() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { contactPerson: true, branches: true },
    });
    const logos = await this.prisma.companyLogo.findMany({
      where: { companyId },
      include: { uploadedFile: true, branch: true },
    });
    return { company, logos };
  }

  @Put('client')
  @ApiOperation({
    summary: 'Atualizar nome do cliente',
    description: 'Atualiza apenas o nome de exibição do cliente (passo “identidade” simplificado).',
  })
  async client(@Body() dto: ClientDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.company.update({
      where: { id: companyId },
      data: { clientDisplayName: dto.clientDisplayName },
    });
  }

  @Put('matrix')
  @ApiOperation({
    summary: 'Gravar dados da matriz e responsável',
    description:
      'Atualiza razão social, CNPJ, contatos e faz upsert da pessoa de contato com validações de CNPJ/CPF/e-mail.',
  })
  async matrix(@Body() dto: MatrixDto) {
    if (!isValidLegalName(dto.legalName)) {
      throw new BadRequestException(
        'Razão social contém caracteres inválidos. Use letras, números e pontuação corporativa básica.',
      );
    }
    const tax = dto.taxId ? onlyDigits(dto.taxId) : '';
    if (tax && tax.length === 14 && !isValidCNPJ(dto.taxId!)) {
      throw new BadRequestException('CNPJ da matriz inválido.');
    }
    if (dto.responsibleCpf && !isValidCPF(dto.responsibleCpf)) {
      throw new BadRequestException('CPF do responsável inválido.');
    }
    const hint = suggestEmailFix(dto.contactEmail);
    if (hint) {
      throw new BadRequestException(
        `Verifique o e-mail. Você quis dizer "${hint}"? Corrija e envie novamente.`,
      );
    }
    const companyId = await this.ctx.getCurrentCompanyId();
    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        legalName: dto.legalName,
        taxId: tax || dto.taxId,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
      },
    });
    await this.prisma.contactPerson.upsert({
      where: { companyId },
      create: {
        companyId,
        name: dto.responsibleName,
        cpf: dto.responsibleCpf ? onlyDigits(dto.responsibleCpf) : dto.responsibleCpf,
        email: dto.contactEmail,
        phone: dto.contactPhone,
      },
      update: {
        name: dto.responsibleName,
        cpf: dto.responsibleCpf ? onlyDigits(dto.responsibleCpf) : dto.responsibleCpf,
        email: dto.contactEmail,
        phone: dto.contactPhone,
      },
    });
    return this.prisma.company.findUnique({
      where: { id: companyId },
      include: { contactPerson: true },
    });
  }

  @Put('branches-config')
  @ApiOperation({
    summary: 'Configurar existência de filiais',
    description: 'Define se a empresa opera com filiais (boolean).',
  })
  async branchesConfig(@Body() dto: BranchesConfigDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.company.update({
      where: { id: companyId },
      data: { hasBranches: dto.hasBranches },
    });
  }

  @Post('branches')
  @ApiOperation({
    summary: 'Adicionar filial',
    description: 'Cria filial na empresa atual com validação de CNPJ duplicado.',
  })
  async addBranch(@Body() dto: BranchCreateDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const bTax = dto.taxId ? onlyDigits(dto.taxId) : '';
    if (bTax) {
      if (bTax.length === 14 && !isValidCNPJ(dto.taxId!)) {
        throw new BadRequestException('CNPJ da filial inválido.');
      }
      const dup = await this.prisma.branch.findFirst({
        where: { companyId, taxId: bTax },
      });
      if (dup) throw new BadRequestException('CNPJ de filial duplicado.');
    }
    return this.prisma.branch.create({
      data: {
        companyId,
        name: dto.name,
        legalName: dto.legalName,
        taxId: bTax || dto.taxId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Put('branding')
  @ApiOperation({
    summary: 'Configurar política de marcas por filial',
    description: 'Indica se haverá logos distintos por filial ou identidade única.',
  })
  async branding(@Body() dto: BrandingDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    return this.prisma.company.update({
      where: { id: companyId },
      data: { hasDifferentBranchLogos: dto.hasDifferentBranchLogos },
    });
  }

  @Post('logo')
  @ApiOperation({
    summary: 'Vincular arquivo de logo',
    description:
      'Associa um upload existente à empresa como logo da matriz ou de uma filial (`LogoScope` + `branchId`).',
  })
  async linkLogo(@Body() dto: LogoLinkDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const file = await this.prisma.uploadedFile.findFirst({
      where: { id: dto.uploadedFileId, companyId },
    });
    if (!file) throw new BadRequestException('Arquivo não encontrado para esta empresa.');
    return this.prisma.companyLogo.create({
      data: {
        companyId,
        branchId: dto.branchId,
        uploadedFileId: dto.uploadedFileId,
        scope: dto.scope,
      },
      include: { uploadedFile: true, branch: true },
    });
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Resumo e checklist da etapa 1',
    description:
      'Retorna flags de completude (nome cliente, matriz, responsável, filiais, documentos CNPJ, branding) e objeto `company` atual.',
  })
  async summary() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { contactPerson: true, branches: true },
    });
    const files = await this.prisma.uploadedFile.count({
      where: { companyId, category: { in: ['CNPJ_MATRIX', 'CNPJ_BRANCH'] } },
    });
    const logos = await this.prisma.companyLogo.count({ where: { companyId } });
    return {
      checklist: {
        clientNamed: !!company?.clientDisplayName && company.clientDisplayName.length >= 3,
        matrixFilled: !!(company?.legalName && company?.taxId),
        responsibleOk: !!company?.contactPerson,
        branchesDefined: company?.hasBranches === false || (company?.branches?.length ?? 0) > 0,
        documentsAttached: files > 0,
        brandingOk: logos > 0 || company?.hasDifferentBranchLogos === false,
      },
      company,
    };
  }
}
