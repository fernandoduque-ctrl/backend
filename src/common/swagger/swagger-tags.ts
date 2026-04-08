import { DocumentBuilder } from '@nestjs/swagger';

/** Descrições das tags (grupos) da API — documentação oficial em português. */
export const SWAGGER_TAG_DEFINITIONS: ReadonlyArray<{ name: string; description: string }> = [
  {
    name: 'auth',
    description:
      'Autenticação: login com e-mail e senha e obtenção do perfil do usuário autenticado. O token JWT retornado deve ser enviado nas demais rotas.',
  },
  {
    name: 'companies',
    description:
      'Cadastro e manutenção de empresas clientes, dados da empresa corrente no contexto e pessoa de contato. Inclui listagem para administradores e consultores.',
  },
  {
    name: 'branches',
    description:
      'Filiais vinculadas a uma empresa: listagem, criação, alteração e exclusão. Utilizado quando a empresa opera com mais de um estabelecimento.',
  },
  {
    name: 'uploads',
    description:
      'Envio e gestão de arquivos (documentos, planilhas, certificados etc.) com categorização por tipo e vínculo opcional a etapas do assistente.',
  },
  {
    name: 'dashboard',
    description:
      'Painel consolidado do onboarding: progresso por etapa, uploads recentes, linha do tempo de auditoria e pendências.',
  },
  {
    name: 'users',
    description:
      'Listagem de usuários do sistema (consulta administrativa).',
  },
  {
    name: 'wizard',
    description:
      'Fluxo principal do assistente de parametrização: etapas, envio para validação, aprovação e reprovação por consultor/admin, conclusão de passos.',
  },
  {
    name: 'wizard-stage-1',
    description:
      'Etapa 1 — Identidade da empresa: nome fantasia, dados da matriz, filiais, marca/logotipos e resumo para checklist.',
  },
  {
    name: 'wizard-stage-2',
    description:
      'Etapa 2 — Estrutura operacional: resumo de contagens (jornadas, centros de custo, bancos de pagamento, departamentos).',
  },
  {
    name: 'wizard-stage-3',
    description:
      'Etapa 3 — Folha e pessoas: previdência complementar, holerites históricos, registro de empregados, alívio tributário e indicadores do checklist.',
  },
  {
    name: 'wizard-stage-4',
    description:
      'Etapa 4 — Benefícios: resumo, checklist de regras, fornecedores e alertas de conformidade (ex.: vale-transporte).',
  },
  {
    name: 'wizard-stage-5',
    description:
      'Etapa 5 — Rubricas de folha: resumo e validação de incidências cadastradas.',
  },
  {
    name: 'wizard-stage-6',
    description:
      'Etapa 6 — eSocial: pré-requisitos de acesso (CNPJ e etapas 1–5 aprovadas), resumo e lotes de importação recentes.',
  },
  {
    name: 'work-schedules',
    description:
      'Jornadas de trabalho (fixa ou escala), dias da semana e importação em lote via CSV.',
  },
  {
    name: 'cost-centers',
    description:
      'Centros de custo por empresa e filial, CRUD e importação CSV com associação opcional a CNPJ de filial.',
  },
  {
    name: 'banks',
    description:
      'Tabela de referência de bancos ativos para seleção em cadastros (ex.: conta de pagamento).',
  },
  {
    name: 'employee-payment-banks',
    description:
      'Bancos utilizados pela empresa para pagamento de salários (agência, dígito, tipo de conta) vinculados ao cadastro de referência de banco.',
  },
  {
    name: 'departments',
    description:
      'Departamentos/setores da empresa, com vínculo opcional a centro de custo.',
  },
  {
    name: 'leave-records',
    description:
      'Registros de afastamentos/licenças por colaborador (nome, tipo, datas e origem).',
  },
  {
    name: 'dependent-records',
    description:
      'Cadastro de dependentes para IR/benefícios: nome, CPF, tipo de dependência, filiação e data de nascimento.',
  },
  {
    name: 'vacation-records',
    description:
      'Controle simplificado de férias: período aquisitivo, dias gozados e pendentes por colaborador (identificado por nome).',
  },
  {
    name: 'benefits',
    description:
      'Parametrização de benefícios (vale-refeição, VT, plano de saúde etc.), regras de coparticipação e valores.',
  },
  {
    name: 'benefit-suppliers',
    description:
      'Fornecedores de benefícios vinculados a cada benefício e upload de arquivo de layout de remessa.',
  },
  {
    name: 'payroll-rubrics',
    description:
      'Rubricas da folha (proventos, descontos, informativas), incidências e importação em lote.',
  },
  {
    name: 'esocial-import',
    description:
      'Lotes de importação de eventos do eSocial: criação, processamento, pré-visualização, confirmação, alertas, logs e exportação de log.',
  },
  {
    name: 'audit-log',
    description:
      'Histórico de auditoria filtrado por empresa, com limite configurável de registros.',
  },
  {
    name: 'settings',
    description:
      'Configurações globais da aplicação persistidas como JSON (chave única default).',
  },
  {
    name: 'documentation',
    description:
      'Documentação técnica derivada do schema: diagrama ER em Mermaid e tabelas descritivas dos modelos.',
  },
];

export function applySwaggerTagDefinitions(builder: DocumentBuilder): DocumentBuilder {
  let b = builder;
  for (const t of SWAGGER_TAG_DEFINITIONS) {
    b = b.addTag(t.name, t.description);
  }
  return b;
}
