import { LockerRepository } from '../domain/LockerRepository.js';

export class ReserveLockerUseCase {
  constructor(private lockerRepository: LockerRepository) {}

  async execute(id: string, memberId: string) {
    const locker = await this.lockerRepository.findById(id);
    if (!locker) {
      const error = new Error('Casillero no encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    if (locker.status !== 'Available') {
      const error = new Error('Este casillero ya no se encuentra disponible.');
      (error as any).statusCode = 409;
      throw error;
    }

    const updatedLocker = await this.lockerRepository.update(id, {
      status: 'Occupied',
      member_id: memberId
    });

    return updatedLocker;
  }
}
