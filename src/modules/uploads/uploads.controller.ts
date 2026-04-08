import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CompaniesContextService } from '../companies/companies-context.service';
import { UploadCategory } from '../../common/prisma-enums';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UpdateUploadDto } from './dto/update-upload.dto';

const ALLOWED = /\.(pdf|png|jpg|jpeg|xlsx|xls|csv|pfx|p12)$/i;

function storageDir(base: string) {
  const dir = join(process.cwd(), base, 'uploads');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

const UPLOAD_CATEGORY_DOC = [
  'Valores típicos de `category` (query):',
  '`CNPJ_MATRIX`, `CNPJ_BRANCH`, `LOGO_COMPANY`, `LOGO_BRANCH`, `PENSION_LIST`, `COURT_ORDERS`,',
  '`HISTORICAL_PAYROLL`, `LEAVE_RECORDS`, `DEPENDENTS`, `EMPLOYEE_REGISTRY`, `TAX_RELIEF`,',
  '`VACATION`, `BENEFIT_LAYOUT`, `CERTIFICATE_A1`, `RUBRICS_SPREADSHEET`, `OTHER`.',
].join(' ');

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: CompaniesContextService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Enviar arquivo',
    description:
      'Upload multipart (`file` + query params). Extensões permitidas: pdf, png, jpg, jpeg, xlsx, xls, csv, pfx, p12. ' +
      'Tamanho máximo 20 MB. ' +
      UPLOAD_CATEGORY_DOC +
      ' `stageNumber` e `stepNumber` associam o arquivo a uma etapa do assistente quando aplicável.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Campo de formulário `file` (obrigatório). Parâmetros adicionais vão na query string.',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Conteúdo binário do arquivo a armazenar.',
        },
      },
    },
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: `Categoria do documento (recomendado; se omitido, usa OTHER). ${UPLOAD_CATEGORY_DOC}`,
    example: UploadCategory.CNPJ_MATRIX,
  })
  @ApiQuery({
    name: 'stageNumber',
    required: false,
    description: 'Número da etapa do wizard relacionada ao upload (opcional).',
    example: '1',
  })
  @ApiQuery({
    name: 'stepNumber',
    required: false,
    description: 'Número do passo dentro da etapa (opcional).',
    example: '2',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const base = process.env.STORAGE_PATH || 'storage';
          cb(null, storageDir(base));
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname) || '';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED.test(file.originalname)) {
          return cb(new BadRequestException('Extensão não permitida'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category: string,
    @Query('stageNumber') stageNumber?: string,
    @Query('stepNumber') stepNumber?: string,
    @CurrentUser() user?: JwtUser,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    const companyId = await this.ctx.getCurrentCompanyId();
    const cat = (category as UploadCategory) || UploadCategory.OTHER;
    const relPath = `uploads/${file.filename}`;

    return this.prisma.uploadedFile.create({
      data: {
        companyId,
        category: cat,
        stageNumber: stageNumber ? parseInt(stageNumber, 10) : null,
        stepNumber: stepNumber ? parseInt(stepNumber, 10) : null,
        originalName: file.originalname,
        storagePath: relPath,
        mimeType: file.mimetype,
        extension: extname(file.originalname).replace('.', ''),
        size: file.size,
        uploadedById: user?.sub,
      },
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar uploads',
    description:
      'Lista até 100 arquivos mais recentes. Se `companyId` for passado na query, filtra por ele; senão usa a empresa do contexto. `category` filtra por tipo.',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'UUID da empresa (opcional; para admin/consultor consultar outra empresa).',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filtra pela mesma enum de categorias do upload.',
    example: UploadCategory.HISTORICAL_PAYROLL,
  })
  async list(@Query('companyId') companyId?: string, @Query('category') category?: string) {
    const cid = companyId || this.ctx.getCurrentCompanyId();
    const cat = category as UploadCategory | undefined;
    return this.prisma.uploadedFile.findMany({
      where: {
        companyId: cid,
        ...(cat ? { category: cat } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter metadados do arquivo',
    description: 'Retorna um registro de upload pelo id (sem stream do binário; use URL pública de arquivos se configurada).',
  })
  @ApiParam({ name: 'id', description: 'UUID do arquivo enviado.' })
  async one(@Param('id') id: string) {
    return this.prisma.uploadedFile.findUnique({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar metadados do arquivo',
    description:
      'Permite marcar arquivo como ilegível e/ou adicionar nota do usuário. Só arquivos da empresa em contexto.',
  })
  @ApiParam({ name: 'id', description: 'UUID do arquivo enviado.' })
  async updateMeta(@Param('id') id: string, @Body() dto: UpdateUploadDto) {
    const companyId = await this.ctx.getCurrentCompanyId();
    const f = await this.prisma.uploadedFile.findFirst({ where: { id, companyId } });
    if (!f) throw new BadRequestException('Arquivo não encontrado');
    return this.prisma.uploadedFile.update({
      where: { id },
      data: {
        illegible: dto.illegible ?? f.illegible,
        userNote: dto.userNote !== undefined ? dto.userNote : f.userNote,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir registro de upload',
    description: 'Remove o registro do banco; o arquivo em disco pode exigir limpeza separada em rotinas de storage.',
  })
  @ApiParam({ name: 'id', description: 'UUID do arquivo enviado.' })
  async del(@Param('id') id: string) {
    await this.prisma.uploadedFile.delete({ where: { id } });
    return { deleted: true };
  }
}
