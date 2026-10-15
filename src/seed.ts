import 'dotenv/config';
import { createPrismaClient } from './adapters/outbound/persistence/createPrismaClient';

// Ensure that the DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dare:dare@localhost:5432/dare';

process.env.DATABASE_URL = databaseUrl;

const prisma = createPrismaClient(databaseUrl);

const principles = [
    { principleId: 'P001_beneficence', category: "beneficence" },
    { principleId: 'P002_sustainability', category: "beneficence" },
    { principleId: 'P003_non-Maleficence', category: "beneficence" },
    { principleId: 'P004_dignity', category: "dignity" },
    { principleId: 'P005_autonomy', category: "dignity" },
    { principleId: 'P006_transparency', category: "dignity" },
    { principleId: 'P007_privacy', category: "dignity" },
    { principleId: 'P008_justice', category: "justice" },
    { principleId: 'P009_solidarity', category: "justice" },
];

async function main() {
    console.log('Starting seed data insertion...');
    console.log(`Using database: ${databaseUrl}`);

    try {
        for (const principle of principles) {
            await prisma.principle.upsert({
                where: {
                    principleId: principle.principleId,
                },
                update: {
                    category: principle.category,
                },
                create: {
                    ...principle,
                },
            });

            console.log(`✓ Seeded principle: ${principle.principleId}`);
        }

        console.log('Seed data insertion completed!');
    } catch (error) {
        console.error('Seed failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();