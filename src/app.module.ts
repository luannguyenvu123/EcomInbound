import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { MappingModule } from './mapping/mapping.module';
import { ExcelModule } from './excel/excel.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    WarehouseModule,
    MappingModule,
    ExcelModule,
    StorageModule,
  ],
})
export class AppModule {}
