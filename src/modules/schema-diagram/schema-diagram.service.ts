import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { getDMMF } from '@prisma/internals';
import { buildSchemaTablesDoc, type SchemaDocTableDto } from './schema-doc.builder';
import { buildMermaidErFromDmmf, type DmmfDatamodel } from './schema-mermaid.builder';

export type SchemaErMermaidDto = {
  mermaid: string;
  generatedAt: string;
  modelCount: number;
  schemaPath: string;
};

export type SchemaTablesDocumentationDto = {
  tabelas: SchemaDocTableDto[];
  generatedAt: string;
  modelCount: number;
  schemaPath: string;
};

/** Incrementar quando a lógica de mermaid ou doc mudar (invalida cache). */
const SCHEMA_CACHE_REVISION = 4;

type CachedPayload = {
  mtimeMs: number;
  revision: number;
  generatedAt: string;
  mermaid: string;
  modelCount: number;
  tabelas: SchemaDocTableDto[];
};

@Injectable()
export class SchemaDiagramService {
  private readonly logger = new Logger(SchemaDiagramService.name);
  private cache: CachedPayload | null = null;

  /**
   * Preferência: ao lado de `dist/` (Nest em `nest start --watch`). Fallback: `cwd/prisma` (monorepo / testes).
   */
  private schemaAbsolutePath(): string {
    const fromDist = join(__dirname, '..', '..', '..', 'prisma', 'schema.prisma');
    if (existsSync(fromDist)) return fromDist;
    return join(process.cwd(), 'prisma', 'schema.prisma');
  }

  private async loadCached(): Promise<CachedPayload> {
    const schemaPath = this.schemaAbsolutePath();
    let mtimeMs: number;
    try {
      mtimeMs = statSync(schemaPath).mtimeMs;
    } catch (e) {
      this.logger.error(`Schema não encontrado: ${schemaPath}`, e);
      throw new InternalServerErrorException(
        `Schema não encontrado: ${schemaPath} (cwd=${process.cwd()})`,
      );
    }

    if (this.cache && this.cache.mtimeMs === mtimeMs && this.cache.revision === SCHEMA_CACHE_REVISION) {
      return this.cache;
    }

    let datamodel: string;
    try {
      datamodel = readFileSync(schemaPath, 'utf-8');
    } catch (e) {
      this.logger.error(`Falha ao ler schema: ${schemaPath}`, e);
      const detail = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`Falha ao ler schema: ${detail}`);
    }

    let dmmf: Awaited<ReturnType<typeof getDMMF>>;
    try {
      dmmf = await getDMMF({ datamodel });
    } catch (e) {
      this.logger.error('getDMMF falhou ao interpretar o schema.', e);
      const detail = e instanceof Error ? e.message : String(e);
      throw new InternalServerErrorException(`getDMMF falhou: ${detail}`);
    }

    const dm = dmmf.datamodel as unknown as DmmfDatamodel;
    let mermaid: string;
    let tabelas: SchemaDocTableDto[];
    try {
      mermaid = buildMermaidErFromDmmf(dm);
      tabelas = buildSchemaTablesDoc(dm);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error('Falha ao montar Mermaid ou documentação tabular.', e);
      throw new InternalServerErrorException(`Geração do diagrama/doc: ${detail}`);
    }

    const payload: CachedPayload = {
      mtimeMs,
      revision: SCHEMA_CACHE_REVISION,
      generatedAt: new Date().toISOString(),
      mermaid,
      modelCount: dm.models.length,
      tabelas,
    };

    this.cache = payload;
    return payload;
  }

  async getErMermaid(): Promise<SchemaErMermaidDto> {
    const c = await this.loadCached();
    return {
      mermaid: c.mermaid,
      generatedAt: c.generatedAt,
      modelCount: c.modelCount,
      schemaPath: 'prisma/schema.prisma',
    };
  }

  async getTablesDocumentation(): Promise<SchemaTablesDocumentationDto> {
    const c = await this.loadCached();
    return {
      tabelas: c.tabelas,
      generatedAt: c.generatedAt,
      modelCount: c.modelCount,
      schemaPath: 'prisma/schema.prisma',
    };
  }
}
