/** Subconjunto do DMMF usado na geração do Mermaid (evita depender de pacotes de tipos extras). */
export type DmmfField = {
  name: string;
  kind: 'scalar' | 'object' | 'enum' | 'unsupported';
  type: string;
  isId: boolean;
  isUnique: boolean;
  isRequired: boolean;
  isList: boolean;
  relationName?: string | null;
  relationFromFields?: string[];
};

export type DmmfModel = {
  name: string;
  fields: DmmfField[];
};

export type DmmfDatamodel = {
  models: DmmfModel[];
};

function mapScalarType(prismaType: string): string {
  switch (prismaType) {
    case 'String':
      return 'string';
    case 'Int':
      return 'int';
    case 'BigInt':
      return 'bigint';
    case 'Float':
      return 'float';
    case 'Boolean':
      return 'bool';
    case 'DateTime':
      return 'datetime';
    case 'Decimal':
      return 'decimal';
    case 'Json':
      return 'json';
    case 'Bytes':
      return 'bytes';
    default:
      return prismaType;
  }
}

function fkFieldNamesForModel(model: DmmfModel): Set<string> {
  const names = new Set<string>();
  for (const f of model.fields) {
    if (f.kind === 'object' && f.relationFromFields?.length) {
      for (const col of f.relationFromFields) names.add(col);
    }
  }
  return names;
}

function buildEntityBlock(model: DmmfModel): string[] {
  const fkCols = fkFieldNamesForModel(model);
  const lines: string[] = [`  ${model.name} {`];

  for (const field of model.fields) {
    if (field.kind === 'scalar') {
      const t = mapScalarType(field.type);
      const tags: string[] = [];
      if (field.isId) tags.push('PK');
      if (fkCols.has(field.name)) tags.push('FK');
      if (field.isUnique && !field.isId) tags.push('UK');
      // Mermaid 11: várias chaves no mesmo atributo → separar por vírgula (ex.: PK, FK).
      const tail = tags.length ? ` ${tags.join(', ')}` : '';
      lines.push(`    ${t} ${field.name}${tail}`);
    } else if (field.kind === 'enum') {
      const tags: string[] = [];
      if (field.isId) tags.push('PK');
      if (field.isUnique && !field.isId) tags.push('UK');
      const tail = tags.length ? ` ${tags.join(', ')}` : '';
      lines.push(`    ${field.type} ${field.name}${tail}`);
    }
  }

  lines.push(`  }`);
  return lines;
}

function slugLabel(relName: string): string {
  return relName.replace(/"/g, "'").slice(0, 48);
}

function buildRelationLines(models: DmmfModel[]): string[] {
  const modelMap = new Map(models.map((m) => [m.name, m]));
  const seenRel = new Set<string>();
  const out: string[] = [];

  for (const m of models) {
    for (const f of m.fields) {
      if (f.kind !== 'object' || !f.relationFromFields?.length) continue;
      const relName = f.relationName;
      if (!relName || seenRel.has(relName)) continue;
      seenRel.add(relName);

      const parentName = f.type;
      const parent = modelMap.get(parentName);
      if (!parent) continue;

      const back = parent.fields.find(
        (x) => x.kind === 'object' && x.relationName === relName && x.name !== f.name,
      );
      if (!back) continue;

      const childName = m.name;
      let connector: string;

      if (back.isList) {
        // Mermaid aceita `||--|{` para FK obrigatório; `||--o{` é mais compatível entre versões.
        connector = `${parentName} ||--o{ ${childName}`;
      } else if (back.isRequired && f.isRequired) {
        connector = `${parentName} ||--|| ${childName}`;
      } else {
        connector = `${parentName} ||--o| ${childName}`;
      }

      out.push(`  ${connector} : "${slugLabel(relName)}"`);
    }
  }

  return out;
}

/** Gera um único diagrama Mermaid `erDiagram` (campos escalares/enums + relações). */
export function buildMermaidErFromDmmf(datamodel: DmmfDatamodel): string {
  const models = datamodel.models;
  const lines: string[] = ['erDiagram'];

  const sorted = [...models].sort((a, b) => a.name.localeCompare(b.name));
  for (const model of sorted) {
    lines.push(...buildEntityBlock(model));
  }

  lines.push(...buildRelationLines(models));

  return `${lines.join('\n')}\n`;
}
