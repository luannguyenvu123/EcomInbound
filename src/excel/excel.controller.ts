import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';
import { ExcelService } from './excel.service';
import { StorageService } from '../storage/storage.service';
import { WarehouseService } from '../warehouse/warehouse.service';
import { MappingService } from '../mapping/mapping.service';
import { ProcessDto } from './dto/excel.dto';

@ApiTags('Excel')
@Controller('api/v1')
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly storageService: StorageService,
    private readonly warehouseService: WarehouseService,
    private readonly mappingService: MappingService,
  ) {}

  @Post('process')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Process Excel file and generate results' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        warehouseId: { type: 'string', example: '1' },
      },
      required: ['file', 'warehouseId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Processing result' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async process(@UploadedFile() file: any, @Body() dto: ProcessDto) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const mappingDict = await this.mappingService.toDict();
    if (mappingDict.size === 0) {
      throw new BadRequestException('No mappings found');
    }

    try {
      const warehouses = await this.warehouseService.findAll();
      const selectedWarehouse = warehouses.find((w) => w.id === dto.warehouseId);

      const result = this.excelService.processBangTheoDoi(file.path, mappingDict);
      result.SelectedWarehouse = selectedWarehouse || null;

      await this.storageService.save(result);

      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      return {
        success: result.Success,
        totalRows: result.TotalRows,
        successRows: result.SuccessRows,
        errorRows: result.ErrorRows,
        totalSlThung: result.TotalSlThung,
        totalSlGoiLe: result.TotalSlGoiLe,
        xeList: result.XeList.map((x) => ({
          name: x.XeName,
          totalSlThung: x.TotalSlThung,
          totalSlGoiLe: x.TotalSlGoiLe,
          itemCount: x.Items.length,
        })),
        warehouse: selectedWarehouse
          ? { code: selectedWarehouse.code, name: selectedWarehouse.name }
          : null,
      };
    } catch (error) {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new BadRequestException('Process failed');
    }
  }

  @Get('export')
  @ApiOperation({ summary: 'Export Haravan file' })
  @ApiResponse({ status: 200, description: 'Excel file' })
  @ApiResponse({ status: 400, description: 'No result found' })
  async export(@Query('xe') xeName: string, @Res() res: Response) {
    const result = await this.storageService.load();
    if (!result) {
      throw new BadRequestException('No result found. Process a file first.');
    }

    const buffer = this.excelService.generateHaravanFile(result, xeName);
    const warehouseCode = result.SelectedWarehouse?.code || 'All';
    const fileName = xeName
      ? `Haravan_${warehouseCode}_${xeName}_${Date.now()}.xlsx`
      : `Haravan_${warehouseCode}_All_${Date.now()}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    res.send(buffer);
  }
}
