import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { Locker } from '../domain/Locker.js';
import { LockerRepository } from '../domain/LockerRepository.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL),
});

export class PrismaLockerRepository implements LockerRepository {
  
  async findByNumber(number: number): Promise<Locker | null> {
    const prismaLocker = await prisma.locker.findUnique({
      where: { number },
    });

    if (!prismaLocker) return null;

    return new Locker(
      prismaLocker.id,
      prismaLocker.number,
      prismaLocker.location,
      prismaLocker.status as any,
      prismaLocker.member_id
    );
  }

  async save(locker: Omit<Locker, 'id'>): Promise<Locker> {
    const createdLocker = await prisma.locker.create({
      data: {
        number: locker.number,
        location: locker.location,
        status: locker.status,
        member_id: locker.member_id,
      },
    });

    return new Locker(
      createdLocker.id,
      createdLocker.number,
      createdLocker.location,
      createdLocker.status as any,
      createdLocker.member_id
    );
  }

  async findById(id: string): Promise<Locker | null> {
    const prismaLocker = await prisma.locker.findUnique({
      where: { id },
    });

    if (!prismaLocker) return null;

    return new Locker(
      prismaLocker.id,
      prismaLocker.number,
      prismaLocker.location,
      prismaLocker.status as any,
      prismaLocker.member_id
    );
  }

async deleteById(id: string): Promise<void> {
    await this.prisma.locker.delete({
      where: { id },
    });
  }

  async update(id: string, data: Partial<Omit<Locker, 'id' | 'number'>>): Promise<Locker> {
    const updated = await prisma.locker.update({
      where: { id },
      data: {
        location: data.location,
        status: data.status,
        member_id: data.member_id,
      },
    });

    return new Locker(
      updated.id,
      updated.number,
      updated.location,
      updated.status as any,
      updated.member_id
    );
  }
}
