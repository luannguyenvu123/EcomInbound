import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { ProcessResult } from '../excel/types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly resultPath: string;

  constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.resultPath = path.join(dataDir, 'last_result.json');
  }

  async save(result: ProcessResult): Promise<void> {
    this.logger.debug('Saving process result');
    fs.writeFileSync(this.resultPath, JSON.stringify(result, null, 2));
  }

  async load(): Promise<ProcessResult | null> {
    if (!fs.existsSync(this.resultPath)) {
      return null;
    }
    try {
      const data = fs.readFileSync(this.resultPath, 'utf-8');
      return JSON.parse(data) as ProcessResult;
    } catch {
      return null;
    }
  }
}
