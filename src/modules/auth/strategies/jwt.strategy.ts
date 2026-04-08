import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export type JwtPayload = { sub: string; email: string; role: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') || 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    let user;
    try {
      user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2021'
      ) {
        throw new ServiceUnavailableException(
          'Banco sem schema Prisma (tabela User inexistente). Na pasta backend: npm run db:push && npm run db:seed',
        );
      }
      throw e;
    }
    if (!user || !user.isActive) throw new UnauthorizedException();
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
  }
}
