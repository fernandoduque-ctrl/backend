/**
 * Textos curtos para o comentário Mermaid de cada atributo no SVG do diagrama ER.
 * Chave = nome do campo no Prisma (o significado costuma ser o mesmo entre modelos).
 * Comentários `///` no schema têm prioridade sobre este mapa.
 */
export const SCHEMA_COLUMN_BRIEF_BY_FIELD: Record<string, string> = {
  id: 'Identificador único (chave primária).',
  accountType: 'Tipo de conta bancária (corrente, poupança, pagamento, etc.).',
  accrualEndDate: 'Data final do período aquisitivo de férias.',
  accrualStartDate: 'Data inicial do período aquisitivo de férias.',
  action: 'Nome da ação registrada na auditoria.',
  active: 'Indica se o registro está ativo e em uso.',
  agency: 'Número da agência bancária.',
  agencyDigit: 'Dígito verificador da agência, se houver.',
  alertType: 'Classificação do alerta gerado na importação eSocial.',
  approvedAt: 'Data e hora em que a etapa foi aprovada.',
  bankReferenceId: 'Referência ao cadastro FEBRABAN do banco.',
  batchId: 'Lote de importação eSocial relacionado.',
  benefitId: 'Benefício ao qual o fornecedor ou arquivo pertence.',
  benefitSupplierId: 'Fornecedor do benefício vinculado ao registro.',
  birthDate: 'Data de nascimento do dependente.',
  branchId: 'Filial associada quando o dado é específico de unidade.',
  breakMinutes: 'Duração do intervalo intrajornada em minutos.',
  category: 'Categoria do arquivo no fluxo do wizard.',
  certificatePasswordHint: 'Lembrete não sensível da senha do certificado.',
  certificateTaxId: 'CNPJ ou CPF vinculado ao certificado digital.',
  certificateType: 'Tipo ou formato do certificado usado na importação.',
  clientDisplayName: 'Nome fantasia ou como a empresa aparece na interface.',
  code: 'Código único ou de referência no contexto da tabela.',
  companyId: 'Empresa proprietária dos dados.',
  companyPercentage: 'Percentual da contribuição patronal no benefício.',
  competence: 'Competência da folha histórica (mês/ano ou identificador).',
  completedAt: 'Data e hora de conclusão da etapa ou do passo.',
  confirmationTextAccepted: 'Indica se o texto legal de confirmação foi aceito.',
  confirmedAt: 'Momento em que o lote eSocial foi confirmado pelo usuário.',
  contactEmail: 'E-mail de contato da empresa.',
  contactPhone: 'Telefone de contato da empresa.',
  costCenterId: 'Centro de custo vinculado ao departamento ou padrão.',
  cpf: 'Cadastro de Pessoa Física, quando aplicável.',
  createdAt: 'Data e hora de criação do registro.',
  currentStage: 'Número da etapa atual do wizard de onboarding.',
  dataJson: 'Configurações globais serializadas em JSON.',
  defaultCostCenterId: 'Centro de custo sugerido por padrão na rubrica.',
  defaultDepartmentId: 'Departamento sugerido por padrão na rubrica.',
  defaultValue: 'Valor monetário padrão quando o benefício usa valor fixo.',
  dependencyType: 'Tipo de dependência para IR ou benefícios.',
  dependentCompanyPercentage: 'Percentual patronal aplicável aos dependentes.',
  dependentEmployeePercentage: 'Percentual do colaborador aplicável aos dependentes.',
  dependentName: 'Nome completo do dependente.',
  description: 'Texto descritivo (alerta, observação ou detalhe).',
  email: 'Endereço de e-mail (login ou contato).',
  employeeName: 'Nome do colaborador referenciado no registro.',
  employeePercentage: 'Percentual descontado ou pago pelo colaborador no benefício.',
  endTime: 'Horário de término da jornada (formato textual).',
  entityId: 'Identificador da entidade afetada no log de auditoria.',
  entityType: 'Tipo da entidade alvo do evento de auditoria.',
  environment: 'Ambiente eSocial (produção, restrita, etc.).',
  expectedReturnDate: 'Previsão de retorno ao trabalho após afastamento.',
  extension: 'Extensão do arquivo original.',
  externalId: 'Identificador externo do registro importado.',
  finalNotes: 'Observações finais do cliente após revisão da etapa.',
  hasActivePension: 'Indica previdência complementar ativa na empresa.',
  hasBranches: 'Indica operação com filiais.',
  hasDependents: 'Indica se o benefício considera dependentes.',
  hasDifferentBranchLogos: 'Permite logos distintos por filial.',
  hasTaxRelief: 'Indica enquadramento em regime de alívio tributário.',
  illegible: 'Marca o arquivo como ilegível para revisão.',
  incidenceESocial: 'A rubrica incide no eSocial.',
  incidenceFGTS: 'A rubrica incide no FGTS.',
  incidenceINSS: 'A rubrica incide no INSS.',
  incidenceIRRF: 'A rubrica incide no IRRF.',
  internalName: 'Nome interno do benefício para referência operacional.',
  isActive: 'Registro ativo no sistema.',
  isPrimary: 'Fornecedor principal entre os do benefício.',
  isRequired: 'Passo obrigatório dentro da etapa do wizard.',
  journeyType: 'Tipo de jornada (fixa, variável, etc.).',
  leaveType: 'Motivo ou tipo do afastamento.',
  legalName: 'Razão social ou denominação legal.',
  metaJson: 'Metadados adicionais em JSON (auditoria).',
  mimeType: 'Tipo MIME do arquivo armazenado.',
  motherName: 'Nome da mãe para cadastro de dependente.',
  name: 'Nome legível do registro no contexto da tabela.',
  nature: 'Natureza da rubrica (provento, desconto, informativa, etc.).',
  notes: 'Observações textuais livres.',
  onboardingStatus: 'Estado geral do processo de implantação.',
  originalName: 'Nome do arquivo como enviado pelo usuário.',
  passwordHash: 'Hash seguro da senha (nunca armazenada em texto puro).',
  payloadJson: 'Corpo JSON do evento ou entidade em staging eSocial.',
  paymentRuleType: 'Regra de pagamento aplicável ao benefício.',
  pendingDays: 'Dias de férias ainda não gozados.',
  periodEnd: 'Data final do período coberto pelo lote eSocial.',
  periodStart: 'Data inicial do período coberto pelo lote eSocial.',
  phone: 'Telefone de contato da pessoa.',
  recordType: 'Tipo de registro ou evento no staging da importação.',
  recurrenceType: 'Periodicidade da rubrica na folha.',
  rejectedAt: 'Data e hora da reprovação da etapa.',
  requestedById: 'Usuário que solicitou o lote de importação.',
  reviewerNotes: 'Parecer ou notas do revisor interno.',
  role: 'Papel de acesso (cliente, administrador, consultor, etc.).',
  rubricType: 'Classificação da verba na estrutura da folha.',
  scope: 'Escopo do logo (empresa inteira, filial específica, etc.).',
  selectedEventsJson: 'Lista JSON dos eventos eSocial selecionados para o lote.',
  severity: 'Gravidade do alerta (informativo, atenção, erro, etc.).',
  size: 'Tamanho do arquivo em bytes.',
  sourceType: 'Origem dos dados (cadastro manual, importação, etc.).',
  stageNumber: 'Número da etapa do wizard (1 a 6).',
  startDate: 'Data de início (afastamento, período, etc.).',
  startTime: 'Horário de início da jornada (formato textual).',
  startedAt: 'Momento em que a etapa foi iniciada.',
  status: 'Situação atual do fluxo ou do registro.',
  stepNumber: 'Número do passo dentro da etapa do wizard.',
  storagePath: 'Caminho interno do arquivo no armazenamento.',
  submittedForValidationAt: 'Envio da etapa para validação pelo cliente.',
  takenDays: 'Quantidade de dias de férias já gozados.',
  taxId: 'CNPJ ou CPF cadastral.',
  title: 'Título exibido (etapa, passo, alerta, etc.).',
  totalDeductions: 'Total de descontos informado para a competência.',
  totalEarnings: 'Total de proventos informado para a competência.',
  transportDiscountPercent: 'Percentual de desconto em vale-transporte.',
  type: 'Tipo ou classificação no domínio da tabela.',
  understoodAck: 'Confirmação de ciência das regras do benefício.',
  updatedAt: 'Data e hora da última alteração.',
  uploadedById: 'Usuário que realizou o upload do arquivo.',
  uploadedFileId: 'Arquivo enviado referenciado pelo registro.',
  userId: 'Usuário associado ao evento de auditoria.',
  userNote: 'Comentário opcional do usuário sobre o arquivo ou registro.',
  valueType: 'Forma de valorização (valor fixo, percentual, etc.).',
  weekday: 'Dia da semana (0 a 6) em que a jornada vale.',
  weeklyRestSuggestion: 'Sugestão de descanso semanal ou folga.',
  workScheduleId: 'Jornada de trabalho vinculada.',
  workloadDailyMinutes: 'Carga horária diária em minutos.',
};

const MAX_MERMAID_COMMENT_LEN = 140;

function truncateComment(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= MAX_MERMAID_COMMENT_LEN) return t;
  return `${t.slice(0, MAX_MERMAID_COMMENT_LEN - 1)}…`;
}

/**
 * Texto exibido após o atributo no Mermaid ER (entre aspas duplas).
 * Aspas duplas internas são removidas (requisito do parser Mermaid).
 */
export function columnBriefForErDiagram(
  _modelName: string,
  fieldName: string,
  prismaDocumentation?: string | null,
): string {
  const fromSchema = prismaDocumentation?.replace(/\s+/g, ' ').trim();
  if (fromSchema) {
    return truncateComment(fromSchema.replace(/"/g, "'"));
  }
  const mapped = SCHEMA_COLUMN_BRIEF_BY_FIELD[fieldName];
  if (mapped) {
    return truncateComment(mapped.replace(/"/g, "'"));
  }
  return truncateComment(`Campo «${fieldName}».`.replace(/"/g, "'"));
}
