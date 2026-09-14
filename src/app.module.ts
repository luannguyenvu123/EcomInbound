import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './common/guards/api-key.guard';
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}
