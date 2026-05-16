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
}
