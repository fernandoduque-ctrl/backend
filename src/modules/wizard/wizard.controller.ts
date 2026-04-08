import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../common/prisma-enums';
import { WizardService } from './wizard.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WizardApproveBodyDto, WizardRejectBodyDto } from './dto/wizard-consultant-actions.dto';

@ApiTags('wizard')
@ApiBearerAuth()
@Controller('wizard')
export class WizardController {
  constructor(private readonly wizard: WizardService) {}

  @Get('stages')
  @ApiOperation({
    summary: 'Listar etapas do assistente',
    description:
      'Retorna todas as etapas do wizard de parametrização para a empresa em contexto, com status, títulos e metadados usados na barra de progresso.',
  })
  stages() {
    return this.wizard.listStages();
  }

  @Get('stages/:stageNumber')
  @ApiOperation({
    summary: 'Detalhar uma etapa',
    description:
      'Obtém o detalhe de uma etapa específica (1 a 6), incluindo passos e estado para exibição na tela da etapa.',
  })
  @ApiParam({
    name: 'stageNumber',
    description: 'Número da etapa do assistente (inteiro, normalmente entre 1 e 6).',
    example: 1,
  })
  stage(@Param('stageNumber') stageNumber: string) {
    return this.wizard.getStage(parseInt(stageNumber, 10));
  }

  @Post('stages/:stageNumber/submit')
  @ApiOperation({
    summary: 'Enviar etapa para validação',
    description:
      'Marca a etapa como enviada para análise do consultor/admin. Após o envio, a equipe Sólides pode aprovar ou reprovar.',
  })
  @ApiParam({
    name: 'stageNumber',
    description: 'Número da etapa a submeter.',
    example: 2,
  })
  submit(@Param('stageNumber') stageNumber: string) {
    return this.wizard.submitForValidation(parseInt(stageNumber, 10));
  }

  @Post('stages/:stageNumber/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CONSULTANT)
  @ApiOperation({
    summary: 'Aprovar etapa (admin ou consultor)',
    description:
      'Aprova formalmente a etapa indicada, liberando o fluxo para a próxima quando aplicável. ' +
      'Exige papel ADMIN ou CONSULTANT.',
  })
  @ApiParam({
    name: 'stageNumber',
    description: 'Número da etapa aprovada.',
    example: 1,
  })
  approve(@Param('stageNumber') stageNumber: string, @Body() dto: WizardApproveBodyDto) {
    return this.wizard.approve(parseInt(stageNumber, 10), dto.notes);
  }

  @Post('stages/:stageNumber/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CONSULTANT)
  @ApiOperation({
    summary: 'Reprovar etapa (admin ou consultor)',
    description:
      'Reprova a etapa com justificativa obrigatória (`notes`), retornando o fluxo ao cliente para correções. ' +
      'Exige papel ADMIN ou CONSULTANT.',
  })
  @ApiParam({
    name: 'stageNumber',
    description: 'Número da etapa reprovada.',
    example: 3,
  })
  reject(@Param('stageNumber') stageNumber: string, @Body() dto: WizardRejectBodyDto) {
    return this.wizard.reject(parseInt(stageNumber, 10), dto.notes);
  }

  @Post('steps/:stageNumber/:stepNumber/complete')
  @ApiOperation({
    summary: 'Marcar passo interno como concluído',
    description:
      'Registra a conclusão de um passo (sub-item) dentro de uma etapa, usado para checklist granular no front-end.',
  })
  @ApiParam({
    name: 'stageNumber',
    description: 'Número da etapa que contém o passo.',
    example: 1,
  })
  @ApiParam({
    name: 'stepNumber',
    description: 'Número sequencial do passo dentro da etapa.',
    example: 2,
  })
  completeStep(
    @Param('stageNumber') stageNumber: string,
    @Param('stepNumber') stepNumber: string,
  ) {
    return this.wizard.completeStep(parseInt(stageNumber, 10), parseInt(stepNumber, 10));
  }
}
