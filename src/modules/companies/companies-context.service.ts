import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { companyContextStorage } from '../../common/context/company-context.storage';

@Injectable()
export class CompaniesContextService {
  constructor(private readonly prisma: PrismaService) {}

  /** Empresa ativa no request (AsyncLocalStorage), definida pelo CompanyContextInterceptor. */
  getCurrentCompanyId(): string {
    const store = companyContextStorage.getStore();
    if (!store?.companyId) {
      throw new InternalServerErrorException('Contexto de empresa não disponível nesta requisição.');
    }
    return store.companyId;
  }

  async requireCompany(companyId: string) {
    const current = this.getCurrentCompanyId();
    if (companyId !== current) {
      throw new ForbiddenException('Operação não permitida para a empresa selecionada.');
    }
    const c = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!c) throw new NotFoundException('Empresa não encontrada');
    return c;
  }
}
