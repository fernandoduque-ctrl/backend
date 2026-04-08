import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Observable, from, mergeMap } from 'rxjs';
import { Request } from 'express';
import { UserRole } from '../prisma-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { companyContextStorage } from '../context/company-context.storage';

type ReqUser = { sub: string; role: UserRole; companyId?: string | null };

@Injectable()
export class CompanyContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request & { user?: ReqUser }>();
    const user = req.user;
    if (!user) {
      return next.handle();
    }
    return from(this.resolveCompanyId(req, user)).pipe(
      mergeMap((companyId) =>
        new Observable((subscriber) => {
          companyContextStorage.run({ companyId }, () => {
            next.handle().subscribe(subscriber);
          });
        }),
      ),
    );
  }

  private async resolveCompanyId(req: Request, user: ReqUser): Promise<string> {
    if (user.companyId) {
      const ok = await this.prisma.company.findFirst({
        where: { id: user.companyId },
        select: { id: true },
      });
      if (!ok) {
        throw new ForbiddenException('Empresa vinculada ao usuário não encontrada.');
      }
      return user.companyId;
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.CONSULTANT) {
      const raw = req.headers['x-company-id'];
      const headerId = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : '';
      if (headerId) {
        const c = await this.prisma.company.findFirst({
          where: { id: headerId },
          select: { id: true },
        });
        if (!c) {
          throw new BadRequestException('X-Company-Id inválido.');
        }
        return c.id;
      }
      const fallback = await this.prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (!fallback) {
        throw new ForbiddenException('Nenhuma empresa cadastrada no sistema.');
      }
      return fallback.id;
    }

    throw new ForbiddenException('Usuário sem empresa vinculada. Solicite o cadastro à Sólides.');
  }
}
