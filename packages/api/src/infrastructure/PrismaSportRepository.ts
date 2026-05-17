import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { Sport } from '../domain/Sport.js';
import { SportRepository } from '../domain/SportRepository.js';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBSport = {
    id: string;
    name: string;
    description: string;
    max_capacity: number;
    additional_price: unknown;
    requires_medical_certificate: boolean;
};

export class PrismaSportRepository implements SportRepository {
    async create(sport: Omit<Sport, 'id'>): Promise<Sport> {
        const created = await prisma.sport.create({
            data: {
                name: sport.name,
                description: sport.description,
                max_capacity: sport.max_capacity,
                additional_price: sport.additional_price,
                requires_medical_certificate: sport.requires_medical_certificate,
            },
        });

        return this.mapToDomain(created);
    }

    async findByName(name: string): Promise<Sport | null> {
        const sport = await prisma.sport.findUnique({
            where: { name },
        });

        return sport ? this.mapToDomain(sport) : null;
    }

    private mapToDomain(sport: DBSport): Sport {
        return new Sport(
            sport.id,
            sport.name,
            sport.description,
            sport.max_capacity,
            Number(sport.additional_price),
            sport.requires_medical_certificate,
        );
    }
}
