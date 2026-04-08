import './instrument-env';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { networkInterfaces } from 'os';

function listLanIpv4(): string[] {
  const nets = networkInterfaces();
  const out: string[] = [];
  for (const list of Object.values(nets)) {
    for (const ni of list ?? []) {
      if (ni.family === 'IPv4' && !ni.internal) {
        out.push(ni.address);
      }
    }
  }
  return [...new Set(out)];
}

function logServerAddresses(port: number): void {
  const p = String(port);
  console.log('');
  console.log(`[API] Porta: ${p}`);
  console.log(`[API] Local:  http://127.0.0.1:${p}/  |  http://localhost:${p}/`);
  const lan = listLanIpv4();
  if (lan.length > 0) {
    console.log('[API] Rede (acesso de outros dispositivos na mesma LAN):');
    for (const ip of lan) {
      console.log(`[API]          http://${ip}:${p}/`);
    }
  }
  console.log(`[API] Swagger: http://127.0.0.1:${p}/api/docs`);
  console.log('');
}
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { applySwaggerTagDefinitions } from './common/swagger/swagger-tags';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const storagePath = process.env.STORAGE_PATH || join(process.cwd(), 'storage');
  if (!existsSync(storagePath)) {
    mkdirSync(storagePath, { recursive: true });
  }
  app.useStaticAssets(join(storagePath), { prefix: '/files/' });

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const apiDescription = [
    '## Documentação oficial da API',
    '',
    'API REST do **Wizard Folha Digital Sólides** para parametrização de folha de pagamento, onboarding assistido e integração com o eSocial.',
    '',
    '### Autenticação',
    '- Obtenha o token com **POST /auth/login** (corpo JSON: `email`, `password`).',
    '- Envie o token em todas as rotas protegidas: cabeçalho `Authorization: Bearer <token>`.',
    '- Em rotas marcadas com cadeado no Swagger, use o botão **Authorize** e informe somente o valor do token (sem o prefixo `Bearer`).',
    '',
    '### Contexto da empresa (multi-tenant)',
    '- A maioria das operações considera a **empresa atual** resolvida automaticamente.',
    '- **Usuário cliente**: a empresa vem do cadastro do usuário (JWT).',
    '- **Administrador ou consultor**: podem enviar o cabeçalho opcional **`X-Company-Id`** com o UUID da empresa a operar. Se omitido, o sistema usa a primeira empresa cadastrada como padrão.',
    '',
    '### Formato das respostas de sucesso',
    '- Respostas JSON bem-sucedidas são normalmente encapsuladas como `{ "success": true, "data": ... }`.',
    '- Rotas que devolvem arquivo (ex.: download de log) não seguem esse envelope.',
    '',
    '### Validação e erros',
    '- Corpos e query params são validados; campos não previstos no contrato podem gerar erro **400**.',
    '- Mensagens de negócio e autorização retornam códigos HTTP adequados com corpo JSON de erro.',
  ].join('\n');

  const config = applySwaggerTagDefinitions(
    new DocumentBuilder()
      .setTitle('Wizard Folha Digital Sólides — API REST')
      .setDescription(apiDescription)
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT obtido em POST /auth/login. Cole apenas o token (o Swagger envia como Bearer automaticamente).',
      }),
  ).build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT || 3001);
  // Render, Fly, Docker, etc.: precisa escutar em todas as interfaces; senão o health check falha e o processo morre com exit 1.
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  logServerAddresses(port);
}

bootstrap().catch((err: unknown) => {
  console.error('[API] Falha ao subir a aplicação:', err);
  process.exit(1);
});
