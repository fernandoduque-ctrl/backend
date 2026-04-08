import { PrismaClient } from '@prisma/client';
import {
  AlertSeverity,
  BenefitPaymentRuleType,
  BenefitType,
  BenefitValueType,
  ESocialEnvironment,
  ImportBatchStatus,
  JourneyType,
  OnboardingStatus,
  RubricType,
  StepStatus,
  UploadCategory,
  UserRole,
  WizardStatus,
} from '../src/common/prisma-enums';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Massa adicional idempotente (upserts / checagens) para demos e testes. */
async function seedMassData(companyId: string, adminId: string) {
  const pwdConsultor = await bcrypt.hash('Consultor@123', 10);
  await prisma.user.upsert({
    where: { email: 'consultor@folhasolid.com' },
    update: { companyId: null },
    create: {
      email: 'consultor@folhasolid.com',
      name: 'Consultor Sólides',
      passwordHash: pwdConsultor,
      role: UserRole.CONSULTANT,
      companyId: null,
      isActive: true,
    },
  });

  const extraBanks = [
    { code: '041', name: 'Banco do Estado do Rio Grande do Sul S.A.' },
    { code: '070', name: 'Banco de Brasília S.A.' },
    { code: '084', name: 'Uniprime Norte do Paraná' },
    { code: '756', name: 'Banco Cooperativo Sicoob S.A.' },
  ];
  for (const b of extraBanks) {
    await prisma.bankReference.upsert({
      where: { code: b.code },
      update: {},
      create: { code: b.code, name: b.name, isActive: true },
    });
  }

  const branchSp = await prisma.branch.findFirst({
    where: { companyId, name: 'Filial SP' },
  });

  const extraCC = [
    { code: 'CC003', name: 'Projetos TI', branchId: null as string | null },
    { code: 'CC004', name: 'Logística', branchId: branchSp?.id ?? null },
    { code: 'CC005', name: 'Comercial', branchId: null },
    { code: 'CC006', name: 'Marketing', branchId: null },
    { code: 'CC007', name: 'Jurídico', branchId: null },
    { code: 'CC008', name: 'Manutenção', branchId: branchSp?.id ?? null },
  ];
  for (const row of extraCC) {
    await prisma.costCenter.upsert({
      where: { companyId_code: { companyId, code: row.code } },
      update: { name: row.name, branchId: row.branchId },
      create: {
        companyId,
        code: row.code,
        name: row.name,
        branchId: row.branchId,
        active: true,
      },
    });
  }

  const ccAdm = await prisma.costCenter.findFirst({ where: { companyId, code: 'CC001' } });
  const extraDept = [
    { code: 'D003', name: 'Comercial' },
    { code: 'D004', name: 'TI' },
    { code: 'D005', name: 'Operações Campo' },
    { code: 'D006', name: 'Jurídico' },
    { code: 'D007', name: 'Marketing' },
  ];
  for (const d of extraDept) {
    await prisma.department.upsert({
      where: { companyId_code: { companyId, code: d.code } },
      update: {},
      create: {
        companyId,
        code: d.code,
        name: d.name,
        costCenterId: ccAdm?.id,
        active: true,
      },
    });
  }

  const wsExists = await prisma.workSchedule.findFirst({
    where: { companyId, name: 'Plantão 12x36' },
  });
  if (!wsExists) {
    const ws2 = await prisma.workSchedule.create({
      data: {
        companyId,
        name: 'Plantão 12x36',
        journeyType: JourneyType.SHIFT,
        startTime: '07:00',
        endTime: '19:00',
        breakMinutes: 60,
        weeklyRestSuggestion: 'Escala 12x36 com folgas compensatórias.',
        workloadDailyMinutes: 660,
        active: true,
      },
    });
    await prisma.workScheduleWeekday.createMany({
      data: [
        { workScheduleId: ws2.id, weekday: 1 },
        { workScheduleId: ws2.id, weekday: 3 },
        { workScheduleId: ws2.id, weekday: 5 },
      ],
    });
  }

  const bb341 = await prisma.bankReference.findFirst({ where: { code: '341' } });
  const epb341 = await prisma.employeePaymentBank.findFirst({
    where: { companyId, agency: '9876' },
  });
  if (bb341 && !epb341) {
    await prisma.employeePaymentBank.create({
      data: {
        companyId,
        bankReferenceId: bb341.id,
        agency: '9876',
        agencyDigit: '2',
        accountType: 'POUPANCA',
      },
    });
  }

  await prisma.pensionConfiguration.upsert({
    where: { companyId },
    update: { hasActivePension: true, notes: 'Desconto em folha — relação em anexo (demo).' },
    create: {
      companyId,
      hasActivePension: true,
      notes: 'Desconto em folha — relação em anexo (demo).',
    },
  });

  await prisma.taxReliefConfiguration.upsert({
    where: { companyId },
    update: { hasTaxRelief: false, notes: 'Sem desoneração no período atual (demo).' },
    create: {
      companyId,
      hasTaxRelief: false,
      notes: 'Sem desoneração no período atual (demo).',
    },
  });

  const makeUpload = async (name: string, category: UploadCategory) => {
    return prisma.uploadedFile.create({
      data: {
        companyId,
        category,
        originalName: name,
        storagePath: `uploads/seed-${name.replace(/\W/g, '_')}.pdf`,
        mimeType: 'application/pdf',
        extension: 'pdf',
        size: 2048 + Math.floor(Math.random() * 8000),
        uploadedById: adminId,
      },
    });
  };

  const comps = ['2024-10', '2024-11', '2024-12'];
  for (const comp of comps) {
    const exists = await prisma.historicalPayrollFile.findUnique({
      where: { companyId_competence: { companyId, competence: comp } },
    });
    if (exists) continue;
    const uf = await makeUpload(`folha-${comp}.pdf`, UploadCategory.HISTORICAL_PAYROLL);
    await prisma.historicalPayrollFile.create({
      data: {
        companyId,
        competence: comp,
        uploadedFileId: uf.id,
        userNote: 'Conferência histórica (seed)',
        totalEarnings: 125000 + Math.floor(Math.random() * 20000),
        totalDeductions: 28000 + Math.floor(Math.random() * 5000),
      },
    });
  }

  const leaves = [
    { employeeName: 'Paula Mendes', leaveType: 'INSS', startDate: new Date('2024-09-01') },
    { employeeName: 'Ricardo Alves', leaveType: 'Acidente', startDate: new Date('2024-11-15') },
    { employeeName: 'Fernanda Costa', leaveType: 'Licença maternidade', startDate: new Date('2024-08-01') },
  ];
  for (const L of leaves) {
    const c = await prisma.leaveRecord.count({
      where: { companyId, employeeName: L.employeeName, leaveType: L.leaveType },
    });
    if (c === 0) {
      await prisma.leaveRecord.create({
        data: {
          companyId,
          employeeName: L.employeeName,
          leaveType: L.leaveType,
          startDate: L.startDate,
          expectedReturnDate: new Date('2025-02-01'),
          sourceType: 'SEED',
        },
      });
    }
  }

  const deps = [
    { dependentName: 'Lucas Souza', dependencyType: 'FILHO', motherName: 'Ana Souza' },
    { dependentName: 'Mariana Lima', dependencyType: 'FILHA', motherName: 'Carla Lima' },
  ];
  for (const d of deps) {
    const c = await prisma.dependentRecord.count({
      where: { companyId, dependentName: d.dependentName },
    });
    if (c === 0) {
      await prisma.dependentRecord.create({
        data: {
          companyId,
          dependentName: d.dependentName,
          dependencyType: d.dependencyType,
          motherName: d.motherName,
          birthDate: new Date('2018-05-20'),
          sourceType: 'SEED',
        },
      });
    }
  }

  const vacs = [
    {
      employeeName: 'João Silva',
      accrualStartDate: new Date('2023-01-01'),
      accrualEndDate: new Date('2023-12-31'),
      takenDays: 20,
      pendingDays: 10,
    },
    {
      employeeName: 'Ana Souza',
      accrualStartDate: new Date('2022-06-01'),
      accrualEndDate: new Date('2023-05-31'),
      takenDays: 30,
      pendingDays: 0,
    },
  ];
  for (const v of vacs) {
    const c = await prisma.vacationRecord.count({
      where: { companyId, employeeName: v.employeeName },
    });
    if (c === 0) {
      await prisma.vacationRecord.create({
        data: { companyId, ...v, sourceType: 'SEED' },
      });
    }
  }

  for (let i = 1; i <= 2; i++) {
    const exists = await prisma.employeeRegistryFile.findFirst({
      where: { companyId, uploadedFile: { originalName: `ficha-registro-${i}.pdf` } },
    });
    if (!exists) {
      const uf = await makeUpload(`ficha-registro-${i}.pdf`, UploadCategory.EMPLOYEE_REGISTRY);
      await prisma.employeeRegistryFile.create({
        data: {
          companyId,
          uploadedFileId: uf.id,
          userNote: `Ficha ativa ${i} (seed)`,
        },
      });
    }
  }

  const extraRubrics = [
    { code: 'P002', name: 'Horas extras 50%', rubricType: RubricType.EARNING, nature: 'HE50' },
    { code: 'P003', name: 'Adicional noturno', rubricType: RubricType.EARNING, nature: 'ADP' },
    { code: 'D002', name: 'Vale transporte', rubricType: RubricType.DEDUCTION, nature: 'VT' },
    { code: 'D003', name: 'Plano saúde', rubricType: RubricType.DEDUCTION, nature: 'PS' },
    { code: 'I001', name: 'Base INSS', rubricType: RubricType.INFORMATIVE, nature: 'INFO' },
  ];
  for (const r of extraRubrics) {
    await prisma.payrollRubric.upsert({
      where: { companyId_code: { companyId, code: r.code } },
      update: {},
      create: {
        companyId,
        code: r.code,
        name: r.name,
        rubricType: r.rubricType,
        nature: r.nature,
        incidenceINSS: r.rubricType === RubricType.EARNING,
        incidenceFGTS: r.rubricType === RubricType.EARNING,
        incidenceIRRF: r.rubricType === RubricType.EARNING,
        incidenceESocial: true,
        isActive: true,
      },
    });
  }

  const va = await prisma.benefit.findFirst({
    where: { companyId, internalName: 'Vale Refeição Corporativo' },
  });
  if (!va) {
    const b = await prisma.benefit.create({
      data: {
        companyId,
        type: BenefitType.FOOD_VOUCHER,
        internalName: 'Vale Refeição Corporativo',
        paymentRuleType: BenefitPaymentRuleType.SPLIT_PERCENT,
        companyPercentage: 60,
        employeePercentage: 40,
        hasDependents: false,
        valueType: BenefitValueType.DAILY,
        defaultValue: 28.5,
        isActive: true,
        understoodAck: true,
      },
    });
    await prisma.benefitSupplier.create({
      data: {
        benefitId: b.id,
        name: 'Ticket Restaurante Demo',
        taxId: '33402864000179',
        isPrimary: true,
      },
    });
  }

  const vt = await prisma.benefit.findFirst({
    where: { companyId, internalName: 'VT Padrão CLT' },
  });
  if (!vt) {
    await prisma.benefit.create({
      data: {
        companyId,
        type: BenefitType.TRANSPORT_VOUCHER,
        internalName: 'VT Padrão CLT',
        paymentRuleType: BenefitPaymentRuleType.SPLIT_PERCENT,
        companyPercentage: 94,
        employeePercentage: 6,
        hasDependents: false,
        valueType: BenefitValueType.DAILY,
        defaultValue: 12,
        transportDiscountPercent: 6,
        isActive: true,
        understoodAck: true,
      },
    });
  }

  const vtAlert = await prisma.benefit.findFirst({
    where: { companyId, internalName: 'VT Alerta >6%' },
  });
  if (!vtAlert) {
    await prisma.benefit.create({
      data: {
        companyId,
        type: BenefitType.TRANSPORT_VOUCHER,
        internalName: 'VT Alerta >6%',
        paymentRuleType: BenefitPaymentRuleType.EMPLOYEE_100,
        hasDependents: false,
        valueType: BenefitValueType.MONTHLY_FIXED,
        defaultValue: 200,
        transportDiscountPercent: 8,
        isActive: true,
        understoodAck: true,
      },
    });
  }

  const batch = await prisma.eSocialImportBatch.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  });
  if (batch) {
    const recCount = await prisma.eSocialImportStageRecord.count({ where: { batchId: batch.id } });
    if (recCount < 8) {
      await prisma.eSocialImportStageRecord.createMany({
        data: [
          {
            batchId: batch.id,
            recordType: 'TRABALHADOR',
            externalId: 'ESOC-003',
            payloadJson: JSON.stringify({ nome: 'Pedro Santos', matricula: '1003' }),
            status: 'STAGED',
          },
          {
            batchId: batch.id,
            recordType: 'FERIAS',
            externalId: 'S2240-02',
            payloadJson: JSON.stringify({ gozo: '2024-07', dias: 15 }),
            status: 'STAGED',
          },
          {
            batchId: batch.id,
            recordType: 'DESLIGAMENTO',
            externalId: 'S2299-01',
            payloadJson: JSON.stringify({ matricula: '0999', data: '2024-10-30' }),
            status: 'STAGED',
          },
        ],
      });
    }
  }

  const auditActions = [
    'PARAMETRIZACAO_CC_ATUALIZADO',
    'BENEFICIO_REVISADO',
    'RUBRICA_INCLUIDA',
    'UPLOAD_HISTORICO',
    'CONSULTOR_COMENTARIO',
  ];
  for (let i = 0; i < auditActions.length; i++) {
    await prisma.auditLog.create({
      data: {
        companyId,
        userId: adminId,
        action: auditActions[i],
        entityType: 'Seed',
        entityId: `seed-${i}`,
        metaJson: JSON.stringify({ ordem: i + 1, origem: 'massa-demo' }),
      },
    });
  }

  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {
      dataJson: JSON.stringify({
        theme: 'corporate',
        notificationsEmail: true,
        darkSidebar: false,
        demoMassSeededAt: new Date().toISOString(),
      }),
    },
    create: {
      id: 'default',
      dataJson: JSON.stringify({ theme: 'corporate', notificationsEmail: true }),
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@folhasolid.com' },
    update: { companyId: null },
    create: {
      email: 'admin@folhasolid.com',
      name: 'Administrador',
      passwordHash,
      role: UserRole.ADMIN,
      companyId: null,
      isActive: true,
    },
  });

  await prisma.bankReference.deleteMany();
  const banks = [
    { code: '001', name: 'Banco do Brasil S.A.' },
    { code: '033', name: 'Banco Santander (Brasil) S.A.' },
    { code: '104', name: 'Caixa Econômica Federal' },
    { code: '237', name: 'Banco Bradesco S.A.' },
    { code: '341', name: 'Itaú Unibanco S.A.' },
    { code: '077', name: 'Banco Inter S.A.' },
    { code: '260', name: 'Nu Pagamentos S.A.' },
    { code: '336', name: 'Banco C6 S.A.' },
  ];
  for (const b of banks) {
    await prisma.bankReference.create({ data: { code: b.code, name: b.name, isActive: true } });
  }

  let company = await prisma.company.findFirst({
    where: { clientDisplayName: 'ACME Brasil Ltda' },
  });
  if (!company) {
    company = await prisma.company.create({
      data: {
        clientDisplayName: 'ACME Brasil Ltda',
        legalName: 'ACME Brasil Participações Ltda',
        taxId: '11222333000181',
        contactEmail: 'rh@acme.example.com',
        contactPhone: '11999998888',
        hasBranches: true,
        hasDifferentBranchLogos: false,
        currentStage: 2,
        onboardingStatus: OnboardingStatus.IN_PROGRESS,
      },
    });
  }

  await prisma.contactPerson.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      name: 'Maria Responsável',
      cpf: '52998224725',
      email: 'maria@acme.example.com',
      phone: '11988887777',
    },
  });

  const pwdClient = await bcrypt.hash('Cliente@123', 10);
  await prisma.user.upsert({
    where: { email: 'cliente@acme.example.com' },
    update: { companyId: company.id },
    create: {
      email: 'cliente@acme.example.com',
      name: 'Cliente ACME',
      passwordHash: pwdClient,
      role: UserRole.CLIENT,
      companyId: company.id,
      isActive: true,
    },
  });

  const branchesData = [
    { name: 'Filial SP', legalName: 'ACME Brasil Ltda - SP', taxId: '11222333000262', isActive: true },
    { name: 'Filial RJ', legalName: 'ACME Brasil Ltda - RJ', taxId: '11222333000343', isActive: true },
  ];
  for (const br of branchesData) {
    await prisma.branch.upsert({
      where: { companyId_taxId: { companyId: company.id, taxId: br.taxId } },
      update: {},
      create: { ...br, companyId: company.id },
    });
  }

  const stageTitles: Record<number, string> = {
    1: 'Identificação e cadastro da empresa',
    2: 'Estrutura operacional da folha',
    3: 'Base histórica e trabalhadores',
    4: 'Parametrização de benefícios',
    5: 'Rubricas e eventos',
    6: 'Importação histórica eSocial',
  };

  for (let s = 1; s <= 6; s++) {
    const approved = s <= 5;
    await prisma.wizardStage.upsert({
      where: { companyId_stageNumber: { companyId: company.id, stageNumber: s } },
      update: {
        title: stageTitles[s],
        status: approved ? WizardStatus.APPROVED : WizardStatus.NOT_STARTED,
        startedAt: new Date(),
        approvedAt: approved ? new Date() : null,
      },
      create: {
        companyId: company.id,
        stageNumber: s,
        title: stageTitles[s],
        status: approved ? WizardStatus.APPROVED : WizardStatus.NOT_STARTED,
        startedAt: new Date(),
        approvedAt: approved ? new Date() : null,
      },
    });
  }

  const stepDefs: { stage: number; steps: { n: number; title: string; status: StepStatus }[] }[] = [
    {
      stage: 1,
      steps: [
        { n: 1, title: 'Identificação do cliente', status: StepStatus.COMPLETED },
        { n: 2, title: 'Dados da matriz', status: StepStatus.COMPLETED },
        { n: 3, title: 'Estrutura de filiais', status: StepStatus.COMPLETED },
        { n: 4, title: 'Identidade visual', status: StepStatus.IN_PROGRESS },
        { n: 5, title: 'Resumo da etapa', status: StepStatus.NOT_STARTED },
      ],
    },
    {
      stage: 2,
      steps: [
        { n: 1, title: 'Introdução', status: StepStatus.COMPLETED },
        { n: 2, title: 'Horários', status: StepStatus.IN_PROGRESS },
        { n: 3, title: 'Centros de custo', status: StepStatus.NOT_STARTED },
        { n: 4, title: 'Bancos e agências', status: StepStatus.NOT_STARTED },
        { n: 5, title: 'Departamentos', status: StepStatus.NOT_STARTED },
        { n: 6, title: 'Resumo', status: StepStatus.NOT_STARTED },
      ],
    },
    {
      stage: 3,
      steps: [
        { n: 1, title: 'Introdução', status: StepStatus.NOT_STARTED },
        { n: 2, title: 'Pensão e ofícios', status: StepStatus.NOT_STARTED },
        { n: 3, title: 'Folha últimos 3 meses', status: StepStatus.NOT_STARTED },
        { n: 4, title: 'Afastados', status: StepStatus.NOT_STARTED },
        { n: 5, title: 'Dependentes', status: StepStatus.NOT_STARTED },
        { n: 6, title: 'Fichas de registro', status: StepStatus.NOT_STARTED },
        { n: 7, title: 'Desoneração', status: StepStatus.NOT_STARTED },
        { n: 8, title: 'Férias', status: StepStatus.NOT_STARTED },
        { n: 9, title: 'Resumo', status: StepStatus.NOT_STARTED },
      ],
    },
    {
      stage: 4,
      steps: [
        { n: 1, title: 'Introdução', status: StepStatus.NOT_STARTED },
        { n: 2, title: 'Tipos de benefícios', status: StepStatus.NOT_STARTED },
        { n: 3, title: 'Cadastro do tipo', status: StepStatus.NOT_STARTED },
        { n: 4, title: 'Regras de cálculo', status: StepStatus.NOT_STARTED },
        { n: 5, title: 'Valores', status: StepStatus.NOT_STARTED },
        { n: 6, title: 'Fornecedor', status: StepStatus.NOT_STARTED },
        { n: 7, title: 'Regras específicas', status: StepStatus.NOT_STARTED },
        { n: 8, title: 'Confirmação', status: StepStatus.NOT_STARTED },
        { n: 9, title: 'Resumo', status: StepStatus.NOT_STARTED },
      ],
    },
    {
      stage: 5,
      steps: [
        { n: 1, title: 'Lista e cadastro', status: StepStatus.NOT_STARTED },
        { n: 2, title: 'Incidências', status: StepStatus.NOT_STARTED },
        { n: 3, title: 'Importação planilha', status: StepStatus.NOT_STARTED },
        { n: 4, title: 'Resumo', status: StepStatus.NOT_STARTED },
      ],
    },
    {
      stage: 6,
      steps: [
        { n: 1, title: 'Entrada', status: StepStatus.NOT_STARTED },
        { n: 2, title: 'Certificado', status: StepStatus.NOT_STARTED },
        { n: 3, title: 'Período', status: StepStatus.NOT_STARTED },
        { n: 4, title: 'Eventos', status: StepStatus.NOT_STARTED },
        { n: 5, title: 'Processamento', status: StepStatus.NOT_STARTED },
        { n: 6, title: 'Pré-visualização', status: StepStatus.NOT_STARTED },
        { n: 7, title: 'Confirmação', status: StepStatus.NOT_STARTED },
        { n: 8, title: 'Status', status: StepStatus.NOT_STARTED },
        { n: 9, title: 'Detalhe lote', status: StepStatus.NOT_STARTED },
      ],
    },
  ];

  for (const sd of stepDefs) {
    for (const st of sd.steps) {
      await prisma.wizardStepProgress.upsert({
        where: {
          companyId_stageNumber_stepNumber: {
            companyId: company.id,
            stageNumber: sd.stage,
            stepNumber: st.n,
          },
        },
        update: { status: st.status, title: st.title },
        create: {
          companyId: company.id,
          stageNumber: sd.stage,
          stepNumber: st.n,
          title: st.title,
          status: st.status,
        },
      });
    }
  }

  const ws = await prisma.workSchedule.findFirst({ where: { companyId: company.id } });
  if (!ws) {
    const schedule = await prisma.workSchedule.create({
      data: {
        companyId: company.id,
        name: 'Administrativo padrão',
        journeyType: JourneyType.FIXED,
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        weeklyRestSuggestion: 'Descanso semanal remunerado ao domingo.',
        workloadDailyMinutes: 480,
        active: true,
      },
    });
    for (const wd of [1, 2, 3, 4, 5]) {
      await prisma.workScheduleWeekday.create({
        data: { workScheduleId: schedule.id, weekday: wd },
      });
    }
  }

  const ccList = await prisma.costCenter.count({ where: { companyId: company.id } });
  if (ccList === 0) {
    await prisma.costCenter.createMany({
      data: [
        { companyId: company.id, code: 'CC001', name: 'Administrativo', active: true },
        { companyId: company.id, code: 'CC002', name: 'Operações', active: true },
      ],
    });
  }

  const bb = await prisma.bankReference.findFirst({ where: { code: '001' } });
  if (bb) {
    const epb = await prisma.employeePaymentBank.findFirst({ where: { companyId: company.id } });
    if (!epb) {
      await prisma.employeePaymentBank.create({
        data: {
          companyId: company.id,
          bankReferenceId: bb.id,
          agency: '1234',
          agencyDigit: '5',
          accountType: 'CORRENTE',
        },
      });
    }
  }

  const deptCount = await prisma.department.count({ where: { companyId: company.id } });
  if (deptCount === 0) {
    const cc = await prisma.costCenter.findFirst({ where: { companyId: company.id } });
    await prisma.department.createMany({
      data: [
        { companyId: company.id, code: 'D001', name: 'RH', costCenterId: cc?.id, active: true },
        { companyId: company.id, code: 'D002', name: 'Financeiro', costCenterId: cc?.id, active: true },
      ],
    });
  }

  const benCount = await prisma.benefit.count({ where: { companyId: company.id } });
  if (benCount === 0) {
    const b = await prisma.benefit.create({
      data: {
        companyId: company.id,
        type: BenefitType.MEAL_VOUCHER,
        internalName: 'VA Padrão',
        paymentRuleType: BenefitPaymentRuleType.COMPANY_100,
        hasDependents: false,
        valueType: BenefitValueType.DAILY,
        defaultValue: 35,
        isActive: true,
        understoodAck: true,
      },
    });
    await prisma.benefitSupplier.create({
      data: {
        benefitId: b.id,
        name: 'Fornecedor VA Demo',
        taxId: '11222333000181',
        isPrimary: true,
      },
    });
  }

  const rubCount = await prisma.payrollRubric.count({ where: { companyId: company.id } });
  if (rubCount === 0) {
    await prisma.payrollRubric.createMany({
      data: [
        {
          companyId: company.id,
          code: 'P001',
          name: 'Salário base',
          rubricType: RubricType.EARNING,
          nature: 'HORAS',
          incidenceINSS: true,
          incidenceFGTS: true,
          incidenceIRRF: true,
          incidenceESocial: true,
          isActive: true,
        },
        {
          companyId: company.id,
          code: 'D001',
          name: 'INSS',
          rubricType: RubricType.DEDUCTION,
          nature: 'PREVIDENCIA',
          incidenceINSS: false,
          incidenceFGTS: false,
          incidenceIRRF: false,
          incidenceESocial: true,
          isActive: true,
        },
      ],
    });
  }

  let batch = await prisma.eSocialImportBatch.findFirst({
    where: { companyId: company.id },
  });
  if (!batch) {
    batch = await prisma.eSocialImportBatch.create({
      data: {
        companyId: company.id,
        requestedById: admin.id,
        certificateType: 'A1',
        certificateTaxId: company.taxId,
        environment: ESocialEnvironment.RESTRICTED_PRODUCTION,
        periodStart: new Date('2023-01-01'),
        periodEnd: new Date('2024-12-31'),
        selectedEventsJson: JSON.stringify(['trabalhadores', 'remuneracoes']),
        status: ImportBatchStatus.COMPLETED_WITH_ALERTS,
        confirmationTextAccepted: false,
      },
    });
    await prisma.eSocialImportStageRecord.createMany({
      data: [
        {
          batchId: batch.id,
          recordType: 'TRABALHADOR',
          externalId: 'ESOC-001',
          payloadJson: JSON.stringify({ nome: 'João Silva', matricula: '1001' }),
          status: 'STAGED',
        },
        {
          batchId: batch.id,
          recordType: 'REMUNERACAO',
          externalId: 'ESOC-R01',
          payloadJson: JSON.stringify({ competencia: '2024-11', valor: 5500 }),
          status: 'STAGED',
        },
      ],
    });
    await prisma.eSocialImportAlert.createMany({
      data: [
        {
          batchId: batch.id,
          severity: AlertSeverity.WARNING,
          alertType: 'RUBRICA_NAO_MAPEADA',
          title: 'Rubrica não mapeada',
          description: 'Evento X123 não possui rubrica equivalente cadastrada.',
        },
        {
          batchId: batch.id,
          severity: AlertSeverity.INFO,
          alertType: 'VINCULO_ENCERRADO',
          title: 'Vínculo encerrado detectado',
          description: '1 vínculo com data de desligamento no período.',
        },
      ],
    });
  }

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: admin.id,
      action: 'SEED',
      entityType: 'Company',
      entityId: company.id,
      metaJson: JSON.stringify({ message: 'Base inicial carregada' }),
    },
  });

  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      dataJson: JSON.stringify({ theme: 'corporate', notificationsEmail: true }),
    },
  });

  await seedMassData(company.id, admin.id);

  console.log('Seed OK. Admin:', admin.email, '/ Admin@123');
  console.log('Consultor:', 'consultor@folhasolid.com', '/ Consultor@123');
  console.log('Massa demo: CC extras, dept, horários, folhas 3 meses, afastamentos, férias, rubricas, benefícios, eSocial + auditoria.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
