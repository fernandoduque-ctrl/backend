import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@folhasolid.com',
    description:
      'E-mail do usuário cadastrado no sistema. Deve ser um endereço válido e corresponder ao login concedido pela Sólides.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Admin@123',
    description:
      'Senha do usuário (mínimo 6 caracteres). Nunca é armazenada em texto puro; use sempre canal seguro (HTTPS) em produção.',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
