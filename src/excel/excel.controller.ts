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
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
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
        items: result.AllItems.map((item) => ({
          sku: item.Sku,
          name: item.Name,
          quyCach: item.QuyCach,
          soLuong: item.SoLuong,
          thungPercent: item.ThungPercent,
          lePercent: item.LePercent,
          slThung: item.SlThung,
          slLe: item.SlLe,
          slGoiLe: item.SlGoiLe,
          finalSku: item.FinalSku,
          hasMapping: item.HasMapping,
          is3N: item.Is3N,
          errorMessage: item.ErrorMessage,
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
  async export(
    @Query('xe') xeName: string,
    @Query('warehouseCode') warehouseCode: string,
    @Query('warehouseName') warehouseName: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.storageService.load();
    if (!result) {
      throw new BadRequestException('No result found. Process a file first.');
    }

    const buffer = this.excelService.generateHaravanFile(result, xeName);

    let warehouseShort = 'All';
    if (warehouseCode) {
      warehouseShort = warehouseCode;
    } else if (result.SelectedWarehouse) {
      warehouseShort = result.SelectedWarehouse.code;
    }

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    const fileName = xeName
      ? `Haravan_${warehouseShort}_${xeName}_${dateStr}.xlsx`
      : `Haravan_${warehouseShort}_${dateStr}.xlsx`;

    const encodedFileName = encodeURIComponent(fileName);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Haravan.xlsx"; filename*=UTF-8''${encodedFileName}`,
    });

    res.end(buffer);
  }
}
