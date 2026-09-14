import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const warehousesPath = path.join(process.cwd(), 'data', 'warehouses.json');
  const warehouses = JSON.parse(fs.readFileSync(warehousesPath, 'utf-8'));

  console.log(`Seeding ${warehouses.length} warehouses...`);

  for (const w of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: w.Code },
      update: { name: w.Name },
      create: { code: w.Code, name: w.Name },
    });
  }

  const mappingsPath = path.join(process.cwd(), 'data', 'mapping.json');
  const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));

  console.log(`Seeding ${mappings.length} product mappings...`);

  await prisma.productMapping.deleteMany({});
  await prisma.productMapping.createMany({
    data: mappings.map((m: any) => ({
      code3n: m.Child,
      code1n: m.Parent,
    })),
  });

  const warehouseCount = await prisma.warehouse.count();
  const mappingCount = await prisma.productMapping.count();

  console.log(`Seeding complete! Warehouses: ${warehouseCount}, Mappings: ${mappingCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
