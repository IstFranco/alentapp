import { prisma } from './database'; 
import { Locker } from '../domain/Locker';
import { LockerRepository } from '../domain/LockerRepository';

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
