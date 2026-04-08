import type { DmmfDatamodel, DmmfField, DmmfModel } from './schema-mermaid.builder';
import { tableDescriptionForModel } from './schema-table-descriptions';

export type SchemaDocColumnDto = {
  campo: string;
  tipo: string;
  obrigatorio: string;
  lista: string;
  chaves: string;
  padrao: string;
  observacoes: string;
};

export type SchemaDocTableDto = {
  nome: string;
  /** Texto funcional da tabela (comentário `///` no model ou mapa interno). */
  descricao: string;
  colunas: SchemaDocColumnDto[];
};

type RichModel = DmmfModel & { documentation?: string };

type RichField = DmmfField & {
  documentation?: string;
  hasDefaultValue?: boolean;
  default?: unknown;
  isUpdatedAt?: boolean;
  isCreatedAt?: boolean;
  relationToFields?: string[];
};

function fkFieldNamesForModel(model: DmmfModel): Set<string> {
  const names = new Set<string>();
  for (const f of model.fields) {
    if (f.kind === 'object' && f.relationFromFields?.length) {
      for (const col of f.relationFromFields) names.add(col);
    }
  }
  return names;
}

function prismaTypeDisplay(field: RichField): string {
  if (field.kind === 'object') {
    const base = field.type;
    if (field.isList) return `${base}[]`;
    return field.isRequired ? base : `${base}?`;
  }
  if (field.kind === 'enum') {
    const base = field.type;
    if (field.isList) return `${base}[]`;
    return field.isRequired ? base : `${base}?`;
  }
  const base = field.type;
  if (field.isList) return `${base}[]`;
  return field.isRequired ? base : `${base}?`;
}

function formatDefault(field: RichField): string {
  if (!field.hasDefaultValue) return '—';
  const d = field.default;
  if (d === null || d === undefined) return 'Sim';
  if (typeof d === 'boolean' || typeof d === 'number') return String(d);
  if (typeof d === 'string') return d.length > 80 ? `${d.slice(0, 77)}…` : d;
  if (typeof d === 'object' && d !== null && 'name' in d) {
    const o = d as { name: string; args?: unknown[] };
    const inner = o.args?.length ? `${o.name}(${JSON.stringify(o.args)})` : `${o.name}()`;
    return inner.length > 100 ? `${inner.slice(0, 97)}…` : inner;
  }
  return 'Sim';
}

function chavesCell(field: RichField, fkCols: Set<string>): string {
  const parts: string[] = [];
  if (field.isId) parts.push('PK');
  if (field.kind === 'scalar' || field.kind === 'enum') {
    if (fkCols.has(field.name)) parts.push('FK');
    if (field.isUnique && !field.isId) parts.push('UK');
  }
  return parts.length ? parts.join(', ') : '—';
}

function observacoesCell(field: RichField): string {
  const bits: string[] = [];
  if (field.documentation?.trim()) bits.push(field.documentation.trim());
  if (field.isUpdatedAt) bits.push('@updatedAt');
  if (field.isCreatedAt) bits.push('@createdAt');
  if (field.kind === 'object') {
    if (field.relationFromFields?.length) {
      const to = field.relationToFields?.length ? field.relationToFields.join(', ') : 'id';
      bits.push(`FK local: ${field.relationFromFields.join(', ')} → ${field.type}.${to}`);
    } else if (field.relationName) {
      bits.push(`Relação: ${field.relationName} (lado inverso)`);
    }
  }
  return bits.length ? bits.join(' · ') : '—';
}

function rowForField(field: RichField, fkCols: Set<string>): SchemaDocColumnDto {
  return {
    campo: field.name,
    tipo: prismaTypeDisplay(field),
    obrigatorio: field.isRequired ? 'Sim' : 'Não',
    lista: field.isList ? 'Sim' : 'Não',
    chaves: chavesCell(field, fkCols),
    padrao: field.kind === 'object' ? '—' : formatDefault(field),
    observacoes: observacoesCell(field),
  };
}

/** Documentação tabular: um bloco por modelo Prisma (todos os campos). */
export function buildSchemaTablesDoc(datamodel: DmmfDatamodel): SchemaDocTableDto[] {
  const sorted = [...datamodel.models].sort((a, b) => a.name.localeCompare(b.name));
  return sorted.map((model) => {
    const fkCols = fkFieldNamesForModel(model);
    const colunas = model.fields.map((f) => rowForField(f as RichField, fkCols));
    const rm = model as RichModel;
    const descricao = tableDescriptionForModel(model.name, rm.documentation);
    return { nome: model.name, descricao, colunas };
  });
}
