import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Autenticar usuário',
    description:
      'Valida e-mail e senha e retorna um token JWT e dados básicos da sessão. ' +
      'Use o token no cabeçalho `Authorization: Bearer ...` nas demais requisições. ' +
      'Rota pública: não envie Bearer aqui.',
  })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Perfil do usuário autenticado',
    description:
      'Retorna informações do usuário vinculadas ao token atual (identificação, papel, empresa quando aplicável). ' +
      'Útil para montar menu, permissões e contexto no front-end.',
  })
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.sub);
  }
}
