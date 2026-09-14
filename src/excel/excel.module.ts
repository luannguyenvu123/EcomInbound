import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { StorageModule } from '../storage/storage.module';
import { WarehouseModule } from '../warehouse/warehouse.module';
import { MappingModule } from '../mapping/mapping.module';

@Module({
  imports: [
    MulterModule.register({ dest: './uploads' }),
    StorageModule,
    WarehouseModule,
    MappingModule,
  ],
  controllers: [ExcelController],
  providers: [ExcelService],
})
export class ExcelModule {}
