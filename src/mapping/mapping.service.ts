import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMappingDto } from './dto/mapping.dto';

export interface MappingResponse {
  child: string;
  parent: string;
}

@Injectable()
export class MappingService {
  private readonly logger = new Logger(MappingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<MappingResponse[]> {
    this.logger.debug('Fetching all mappings');
    const mappings = await this.prisma.productMapping.findMany({
      where: { isActive: true },
      select: { code3n: true, code1n: true },
    });
    return mappings.map((m) => ({ child: m.code3n, parent: m.code1n }));
  }

  async toDict(): Promise<Map<string, string>> {
    const mappings = await this.findAll();
    const dict = new Map<string, string>();
    mappings.forEach((item) => {
      if (item.child && item.parent) {
        dict.set(item.child.toUpperCase(), item.parent.toUpperCase());
      }
    });
    return dict;
  }

  async create(dto: CreateMappingDto): Promise<MappingResponse> {
    const existing = await this.prisma.productMapping.findFirst({
      where: {
        code3n: dto.child.toUpperCase(),
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException(`Mapping ${dto.child} already exists`);
    }

    this.logger.debug(`Creating mapping: ${dto.child} -> ${dto.parent}`);
    await this.prisma.productMapping.create({
      data: {
        code3n: dto.child.toUpperCase(),
        code1n: dto.parent.toUpperCase(),
      },
    });

    return { child: dto.child.toUpperCase(), parent: dto.parent.toUpperCase() };
  }

  async save(mappings: MappingResponse[]): Promise<void> {
    this.logger.debug(`Saving ${mappings.length} mappings`);
    await this.prisma.productMapping.deleteMany({});
    await this.prisma.productMapping.createMany({
      data: mappings.map((m) => ({
        code3n: m.child,
        code1n: m.parent,
        isActive: true,
      })),
    });
  }

  async remove(child: string): Promise<void> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: { code3n: child.toUpperCase(), isActive: true },
    });

    if (!mapping) {
      throw new NotFoundException(`Mapping ${child} not found`);
    }

    this.logger.debug(`Deleting mapping: ${child}`);
    await this.prisma.productMapping.update({
      where: { id: mapping.id },
      data: { isActive: false },
    });
  }
}
