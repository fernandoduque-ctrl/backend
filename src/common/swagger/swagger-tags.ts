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
      'Fluxo principal do assistente: `GET /wizard/etapas`, detalhe `GET /wizard/etapas/:etapaNumero`, envio `POST .../submit`, aprovação/reprovação por consultor/admin e conclusão de passos `POST /wizard/passos/:etapaNumero/:passoNumero/complete`.',
  },
  {
    name: 'wizard-empresa-cadastro',
    description:
      'Identificação e cadastro da empresa (etapa 1 do assistente). Rotas REST em `/wizard/empresa-cadastro`: matriz, filiais, identidade visual e resumo do checklist.',
  },
  {
    name: 'wizard-folha-operacional',
    description:
      'Estrutura operacional da folha (etapa 2). Rotas em `/wizard/folha-operacional`: resumo de jornadas, centros de custo, bancos de pagamento e departamentos.',
  },
  {
    name: 'wizard-historico-trabalhadores',
    description:
      'Base histórica e trabalhadores (etapa 3). Rotas em `/wizard/historico-trabalhadores`: previdência, holerites, afastamentos, dependentes, férias e indicadores.',
  },
  {
    name: 'wizard-beneficios',
    description:
      'Parametrização de benefícios (etapa 4). Rotas em `/wizard/beneficios`: resumo, regras, fornecedores e alertas (ex.: vale-transporte).',
  },
  {
    name: 'wizard-rubricas-eventos',
    description:
      'Rubricas e eventos de folha (etapa 5). Rotas em `/wizard/rubricas-eventos`: resumo e validação de incidências cadastradas.',
  },
  {
    name: 'wizard-importacao-esocial',
    description:
      'Importação histórica eSocial (etapa 6). Rotas em `/wizard/importacao-esocial`: pré-requisitos de acesso, resumo e lotes recentes.',
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
