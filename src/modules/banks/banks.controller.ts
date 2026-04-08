import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('banks')
@ApiBearerAuth()
@Controller('banks')
export class BanksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar bancos de referência',
    description:
      'Catálogo de instituições financeiras ativas (`isActive`), ordenadas pelo código do banco. ' +
      'Usado para preencher comboboxes em cadastros como “banco para pagamento de salários”.',
  })
  list() {
    return this.prisma.bankReference.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }
}
