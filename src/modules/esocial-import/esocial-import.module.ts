import { Module } from '@nestjs/common';
import { EsocialImportController } from './esocial-import.controller';
import { EsocialImportService } from './esocial-import.service';

@Module({
  controllers: [EsocialImportController],
  providers: [EsocialImportService],
  exports: [EsocialImportService],
})
export class EsocialImportModule {}
