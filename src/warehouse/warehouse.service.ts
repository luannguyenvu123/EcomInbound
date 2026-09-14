import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WarehouseResponse {
  id: string;
  code: string;
  name: string;
}

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<WarehouseResponse[]> {
    this.logger.debug('Fetching all warehouses');
    const warehouses = await this.prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });
    return warehouses;
  }

  async findByCode(code: string): Promise<WarehouseResponse | null> {
    this.logger.debug(`Finding warehouse by code: ${code}`);
    return this.prisma.warehouse.findUnique({
      where: { code },
      select: { id: true, code: true, name: true },
    });
  }
}
