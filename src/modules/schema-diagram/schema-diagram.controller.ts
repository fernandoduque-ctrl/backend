import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  SchemaDiagramService,
  type SchemaErMermaidDto,
  type SchemaTablesDocumentationDto,
} from './schema-diagram.service';

@ApiTags('documentation')
@Controller('documentation')
export class SchemaDiagramController {
  constructor(private readonly schemaDiagram: SchemaDiagramService) {}

  @Public()
  @Get('schema-er-mermaid')
  @ApiOperation({
    summary: 'Diagrama entidade-relacionamento (Mermaid)',
    description:
      'Gera dinamicamente um texto no formato **Mermaid** `erDiagram` a partir do `schema.prisma` (via DMMF do Prisma). ' +
      'Inclui modelos, campos escalares e enums, chaves primárias/estrangeiras/únicas e cardinalidade das relações. ' +
      'Útil para colar em Wiki, Confluence ou visualizadores Mermaid.',
  })
  async schemaErMermaid(): Promise<SchemaErMermaidDto> {
    return this.schemaDiagram.getErMermaid();
  }

  @Public()
  @Get('schema-tables-doc')
  @ApiOperation({
    summary: 'Documentação tabular dos modelos',
    description:
      'Para cada modelo Prisma, lista colunas com nome, tipo, obrigatoriedade, chaves, valor padrão e observações. ' +
      'Destina-se à documentação textual oficial ou exportação para manuais técnicos do cliente.',
  })
  async schemaTablesDoc(): Promise<SchemaTablesDocumentationDto> {
    return this.schemaDiagram.getTablesDocumentation();
  }
}
