import { LockerRepository } from '../domain/LockerRepository.js';

export class ReleaseLockerUseCase {
  constructor(private lockerRepository: LockerRepository) {}

  async execute(id: string, sessionMemberId: string) {
    // 1. Validar existencia
    const locker = await this.lockerRepository.findById(id);
    if (!locker) {
      const error = new Error('Casillero no encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    // 2. Validar que el estado sea 'Occupied'
    if (locker.status !== 'Occupied') {
      const error = new Error('El casillero no se encuentra reservado.');
      (error as any).statusCode = 400;
      throw error;
    }

    // 3. Validar propiedad (que coincida con el socio en sesión)
    if (locker.member_id !== sessionMemberId) {
      const error = new Error('No tienes autorización para liberar este casillero.');
      (error as any).statusCode = 403; // Forbidden
      throw error;
    }

    // 4. Liberación atómica: member_id a null y status a Available
    const updatedLocker = await this.lockerRepository.update(id, {
      status: 'Available',
      member_id: null
    });

    return updatedLocker;
  }
}
