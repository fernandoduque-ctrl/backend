import { Module } from '@nestjs/common';
import { SchemaDiagramController } from './schema-diagram.controller';
import { SchemaDiagramService } from './schema-diagram.service';

@Module({
  controllers: [SchemaDiagramController],
  providers: [SchemaDiagramService],
})
export class SchemaDiagramModule {}
