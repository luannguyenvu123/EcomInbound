import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';

@ApiTags('Warehouses')
@Controller('api/v1/warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  @ApiResponse({ status: 200, description: 'List of warehouses' })
  async findAll() {
    const warehouses = await this.warehouseService.findAll();
    return { data: warehouses, total: warehouses.length };
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get warehouse by code' })
  @ApiResponse({ status: 200, description: 'Warehouse found' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async findByCode(@Param('code') code: string) {
    const warehouse = await this.warehouseService.findByCode(code);
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${code} not found`);
    }
    return { data: warehouse };
  }
}
