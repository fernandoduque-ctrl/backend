/**
 * Descrições funcionais das tabelas (modelos Prisma) para documentação.
 * Chave = nome exato do model no schema.
 */
export const SCHEMA_TABLE_DESCRIPTIONS: Record<string, string> = {
  User:
    'Usuários que acessam o sistema (login por e-mail/senha). Perfis incluem cliente vinculado a uma empresa, administrador ou consultor. Registra uploads feitos pelo usuário, lotes de importação eSocial solicitados e trilha de auditoria das ações.',
  Company:
    'Empresa cliente em onboarding na folha: dados cadastrais, CNPJ, contato, flags de filiais e logos, estágio atual do wizard e status do processo. Agrega toda a parametrização operacional (jornadas, CC, departamentos, benefícios, rubricas, etc.) e vínculos com usuários e arquivos.',
  ContactPerson:
    'Pessoa de contato principal da empresa (nome, CPF, e-mail, telefone), relação 1:1 com Company. Usada para comunicação e referência cadastral no processo de implantação.',
  Branch:
    'Filiais ou unidades da empresa (nome, razão social opcional, CNPJ quando aplicável). Permite centros de custo e logos específicos por filial quando a matriz opera com filiais.',
  UploadedFile:
    'Metadados de arquivos enviados ao servidor (nome original, caminho no storage, MIME, tamanho, categoria e etapa do wizard). Referenciado por logos, folhas históricas, registros de colaboradores e layouts de benefício.',
  CompanyLogo:
    'Associação entre empresa (e opcionalmente filial) e arquivo de logo já enviado, com escopo (ex.: matriz vs filial). Garante rastreabilidade do arquivo usado na identidade visual.',
  WizardStage:
    'Estado de cada uma das etapas numeradas do wizard (1–6) por empresa: título, status, datas de início/conclusão, envio para validação, aprovação/reprovação e notas do revisor ou do cliente.',
  WizardStepProgress:
    'Progresso granular por combinação empresa + etapa + passo do wizard (título, obrigatoriedade, status e data de conclusão). Complementa WizardStage para checklist operacional.',
  WorkSchedule:
    'Jornada de trabalho parametrizada (tipo fixo/variável, horários, intervalo, sugestões de descanso, carga diária em minutos). Usada no cadastro operacional e consistência com legislação trabalhista.',
  WorkScheduleWeekday:
    'Dias da semana (0–6) vinculados a uma WorkSchedule, definindo em quais dias aquela jornada se aplica.',
  CostCenter:
    'Centro de custo por empresa (código e nome), opcionalmente atrelado a uma filial. Usado em departamentos, rubricas padrão e alocação analítica da folha.',
  BankReference:
    'Tabela de referência de bancos (código FEBRABAN, nome, ativo). Não é por empresa: alimenta a escolha de banco em contas de pagamento de colaboradores.',
  EmployeePaymentBank:
    'Bancos e agências que a empresa utiliza para pagamento de salários (por empresa), referenciando BankReference. Dados de agência, dígito e tipo de conta conforme convênio.',
  Department:
    'Departamento ou setor (código e nome) por empresa, com vínculo opcional a um centro de custo. Usado em rubricas padrão e organização da folha.',
  PensionConfiguration:
    'Configuração 1:1 da empresa sobre previdência complementar ativa e observações. Etapa do wizard de histórico/parametrização.',
  HistoricalPayrollFile:
    'Registro de folha histórica por competência: liga empresa ao arquivo enviado, notas do usuário e totais opcionais de proventos/descontos para conferência.',
  LeaveRecord:
    'Afastamentos de colaboradores (nome, tipo, datas, retorno previsto, origem manual/importação). Base para histórico e consistência com benefícios e folha.',
  DependentRecord:
    'Dependentes para IR/benefícios (nome, CPF, tipo de dependência, nome da mãe, nascimento). Origem manual ou importada; suporta regras de benefícios com dependentes.',
  EmployeeRegistryFile:
    'Arquivo de registro de empregados (upload) vinculado à empresa, com nota opcional. Usado na etapa de base histórica/cadastros.',
  TaxReliefConfiguration:
    'Configuração 1:1 sobre se a empresa possui regime de redução de carga tributária (e notas). Alimenta parametrização fiscal da folha.',
  VacationRecord:
    'Controle de férias por colaborador (nome, período aquisitivo, dias gozados e pendentes, origem). Apoia planejamento e conferência com a folha.',
  Benefit:
    'Definição de benefício da empresa (tipo, nome interno, regra de pagamento, percentuais, dependentes, valor fixo/percentual, transporte, flags de ativo e ciência). Base para fornecedores e cálculos.',
  BenefitSupplier:
    'Fornecedor de um benefício (nome, CNPJ, principal). Um benefício pode ter vários fornecedores; layouts de arquivo ficam em BenefitSupplierLayoutFile.',
  BenefitSupplierLayoutFile:
    'Arquivo de layout (formato do fornecedor) anexado a um BenefitSupplier, referenciando UploadedFile para rastreio e reprocessamento.',
  PayrollRubric:
    'Rubrica da folha (código, nome, tipo, natureza, incidências INSS/FGTS/IRRF/eSocial, recorrência, CC/depto padrão). Estrutura central da parametrização de verbas.',
  ESocialImportBatch:
    'Lote de importação eSocial: certificado, ambiente, período, eventos selecionados (JSON), status, confirmação legal e usuário solicitante. Agrega registros de staging e alertas.',
  ESocialImportStageRecord:
    'Registro intermediário (staging) de um evento ou entidade importada no lote: tipo, ID externo, payload JSON e status até gravação definitiva ou erro.',
  ESocialImportAlert:
    'Alerta gerado durante processamento do lote (severidade, tipo, título, descrição), para revisão humana antes ou depois da confirmação.',
  AuditLog:
    'Trilha de auditoria: ação, tipo e ID de entidade afetada, metadados JSON opcionais, usuário e empresa no contexto. Suporta compliance e suporte.',
  AppSettings:
    'Configurações globais da aplicação em um único registro (id fixo default): JSON livre para preferências do sistema, atualizado conforme necessidade operacional.',
};

export function tableDescriptionForModel(modelName: string, schemaDocumentation?: string | null): string {
  const fromSchema = schemaDocumentation?.trim();
  if (fromSchema) return fromSchema;
  return SCHEMA_TABLE_DESCRIPTIONS[modelName] ?? '—';
}
