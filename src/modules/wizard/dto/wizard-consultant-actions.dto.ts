import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Corpo da aprovação de etapa pelo consultor ou administrador. */
export class WizardApproveBodyDto {
  @ApiPropertyOptional({
    description:
      'Notas opcionais do revisor registradas junto à aprovação (histórico e comunicação com o cliente).',
    example: 'Dados conferidos. Aprovado para etapa seguinte.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/** Corpo da reprovação de etapa — a justificativa é obrigatória para o cliente corrigir. */
export class WizardRejectBodyDto {
  @ApiProperty({
    description:
      'Motivo da reprovação exibido ao cliente; deve orientar quais correções são necessárias na etapa.',
    example: 'CNPJ da matriz divergente do cartão CNPJ enviado. Atualize o cadastro e reenvie o documento.',
  })
  @IsString()
  notes: string;
}
