import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export function createPrismaClient(url?: string): PrismaClient {
    const connectionString = url ?? process.env.DATABASE_URL;
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

export { PrismaClient } from '../../../generated/prisma/client';
