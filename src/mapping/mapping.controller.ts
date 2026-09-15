import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { MappingService } from './mapping.service';
import { CreateMappingDto } from './dto/mapping.dto';

@ApiTags('Mappings')
@Controller('api/v1/mappings')
export class MappingController {
  private readonly logger = new Logger(MappingController.name);

  constructor(private readonly mappingService: MappingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all mappings' })
  @ApiResponse({ status: 200, description: 'List of mappings' })
  async findAll() {
    const mappings = await this.mappingService.findAll();
    return { data: mappings, total: mappings.length };
  }

  @Post()
  @ApiOperation({ summary: 'Create a mapping' })
  @ApiResponse({ status: 201, description: 'Mapping created' })
  @ApiResponse({ status: 409, description: 'Mapping already exists' })
  async create(@Body() dto: CreateMappingDto) {
    const mapping = await this.mappingService.create(dto);
    return { message: 'Created', data: mapping };
  }

  @Post('import')
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
  @ApiOperation({ summary: 'Import mappings from Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Import completed' })
  async import(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Importing file: ${file.originalname} (${file.size} bytes)`);

    try {
      const workbook = XLSX.readFile(file.path);
      this.logger.log(`Sheet names: ${workbook.SheetNames.join(', ')}`);

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      this.logger.log(`Total rows: ${data.length}`);
      if (data.length > 0) {
        this.logger.log(`Header row: ${JSON.stringify(data[0])}`);
      }
      if (data.length > 1) {
        this.logger.log(`First data row: ${JSON.stringify(data[1])}`);
      }

      const existingMappings = await this.mappingService.findAll();
      const dict = new Map(existingMappings.map((m) => [m.child.toUpperCase(), m.parent.toUpperCase()]));
      this.logger.log(`Existing mappings: ${dict.size}`);

      let lastParentCode = '';
      let addedCount = 0;
      let skippedCount = 0;

      data.slice(1).forEach((row: any[], idx: number) => {
        try {
          let parentCode = row[1]?.toString().trim() || '';
          const childCode = row[2]?.toString().trim() || '';
          const parentFromLastCol = row[8]?.toString().trim() || '';

          if (!parentCode && parentFromLastCol) parentCode = parentFromLastCol;
          if (!parentCode) parentCode = lastParentCode;
          if (parentCode) lastParentCode = parentCode;

          if (parentCode && childCode) {
            dict.set(childCode.toUpperCase(), parentCode.toUpperCase());
            addedCount++;
          } else {
            skippedCount++;
            if (idx < 5) {
              this.logger.warn(`Row ${idx + 2} skipped: parent="${parentCode}", child="${childCode}"`);
            }
          }
        } catch (rowErr: any) {
          this.logger.error(`Error processing row ${idx + 2}: ${rowErr.message}`);
          skippedCount++;
        }
      });

      this.logger.log(`Parsed: ${addedCount} mappings, ${skippedCount} skipped`);

      const updatedMappings = Array.from(dict.entries()).map(([child, parent]) => ({ child, parent }));
      await this.mappingService.save(updatedMappings);

      this.logger.log(`Saved ${updatedMappings.length} total mappings to database`);

      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

      return { message: 'Imported', count: addedCount, skipped: skippedCount };
    } catch (error: any) {
      this.logger.error(`Import failed: ${error.message}`, error.stack);
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new BadRequestException(`Import failed: ${error.message}`);
    }
  }

  @Get('template')
  @ApiOperation({ summary: 'Download mapping template Excel' })
  downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ['STT', 'Mã cha', 'Mã con', 'Tên', 'ĐVT', 'Mã kho', 'Quy cách', 'Số lượng'],
      [1, '1NBDGVFDC31N', '3NBDGHDDC001N', 'Bánh đa cua 60grx30 NĐ (MCPP)', 'Thùng', 'HD', 30, 100],
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, ws, 'Template');

    return {
      buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
      filename: 'mapping_template.xlsx',
    };
  }

  @Delete(':child')
  @ApiOperation({ summary: 'Delete a mapping by child code' })
  @ApiResponse({ status: 200, description: 'Mapping deleted' })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async remove(@Param('child') child: string) {
    await this.mappingService.remove(child);
    return { message: 'Deleted', child: child.toUpperCase() };
  }
}
