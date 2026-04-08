import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';
import { UploadCategory } from '../../common/prisma-enums';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { isValidCNPJ, onlyDigits } from '../../common/utils/br-validators';

class CreateSupplierDto {
  @ApiProperty({
    description: 'UUID do benefício ao qual o fornecedor será vinculado.',
  })
  @IsString()
  benefitId: string;

  @ApiProperty({ description: 'Razão social ou nome do fornecedor do benefício.', example: 'Ticket Serviços SA' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'CNPJ do fornecedor (validado quando 14 dígitos).',
    example: '12.345.678/0001-90',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Indica fornecedor principal do benefício quando há vários.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

class UpdateSupplierDto {
  @ApiProperty({ description: 'Nome atualizado do fornecedor.' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'CNPJ atualizado (validado quando 14 dígitos).' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Define ou remove status de fornecedor principal.', example: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

@ApiTags('benefit-suppliers')
@ApiBearerAuth()
@Controller('benefit-suppliers')
export class BenefitSuppliersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar fornecedores de benefícios',
    description:
      'Lista fornecedores de todos os benefícios da empresa em contexto, com benefício, arquivos de layout e upload relacionados.',
  })
  async list() {
    const companyId = await this.ctx.getCurrentCompanyId();
    const benefits = await this.prisma.benefit.findMany({
      where: { companyId },
      select: { id: true },
    });
    const ids = benefits.map((b) => b.id);
    return this.prisma.benefitSupplier.findMany({
      where: { benefitId: { in: ids } },
      include: { benefit: true, layoutFiles: { include: { uploadedFile: true } } },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Criar fornecedor',
    description: 'Vincula um novo fornecedor a um benefício existente.',
  })
  async create(@Body() dto: CreateSupplierDto) {
    if (dto.taxId && onlyDigits(dto.taxId).length === 14 && !isValidCNPJ(dto.taxId)) {
      throw new BadRequestException('CNPJ do fornecedor inválido');
    }
    return this.prisma.benefitSupplier.create({
      data: {
        benefitId: dto.benefitId,
        name: dto.name,
        taxId: dto.taxId ? onlyDigits(dto.taxId) : dto.taxId,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar fornecedor',
    description: 'Atualiza nome, CNPJ e flag de principal.',
  })
  @ApiParam({ name: 'id', description: 'UUID do fornecedor de benefício.' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    if (dto.taxId && onlyDigits(dto.taxId).length === 14 && !isValidCNPJ(dto.taxId)) {
      throw new BadRequestException('CNPJ do fornecedor inválido');
    }
    return this.prisma.benefitSupplier.update({
      where: { id },
      data: {
        name: dto.name,
        taxId: dto.taxId ? onlyDigits(dto.taxId) : dto.taxId,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir fornecedor',
    description: 'Remove o fornecedor; arquivos de layout podem precisar de tratamento prévio.',
  })
  @ApiParam({ name: 'id', description: 'UUID do fornecedor de benefício.' })
  async remove(@Param('id') id: string) {
    await this.prisma.benefitSupplier.delete({ where: { id } });
    return { deleted: true };
  }

  @Post(':id/layout-file')
  @ApiOperation({
    summary: 'Anexar arquivo de layout ao fornecedor',
    description:
      'Envia arquivo (multipart campo `file`) associado ao fornecedor para remessa/conferência de benefício. ' +
      'Cria registro em uploads com categoria BENEFIT_LAYOUT.',
  })
  @ApiParam({ name: 'id', description: 'UUID do fornecedor de benefício.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo binário do layout (até 15 MB).',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo do layout fornecido pela operadora (planilha, PDF, etc.).',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_r, _f, cb) => {
          const base = process.env.STORAGE_PATH || 'storage';
          const dir = join(process.cwd(), base, 'uploads');
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_r, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname) || ''}`),
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async layout(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtUser,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    const companyId = await this.ctx.getCurrentCompanyId();
    const relPath = `uploads/${file.filename}`;
    const uf = await this.prisma.uploadedFile.create({
      data: {
        companyId,
        category: UploadCategory.BENEFIT_LAYOUT,
        originalName: file.originalname,
        storagePath: relPath,
        mimeType: file.mimetype,
        extension: extname(file.originalname).replace('.', ''),
        size: file.size,
        uploadedById: user.sub,
      },
    });
    return this.prisma.benefitSupplierLayoutFile.create({
      data: {
        benefitSupplierId: id,
        uploadedFileId: uf.id,
      },
      include: { uploadedFile: true },
    });
  }
}
