import { LockerRepository } from '../domain/LockerRepository.js';

export class UpdateLockerStatusUseCase {
  constructor(private lockerRepository: LockerRepository) {}

  async execute(id: string, newStatus: 'Available' | 'Maintenance') {
    // 1. Validar existencia
    const locker = await this.lockerRepository.findById(id);
    if (!locker) {
      const error = new Error('Casillero no encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    // 2. Prevenir bloqueos si el casillero está siendo usado por un socio
    if (locker.status === 'Occupied') {
      const error = new Error('No se puede inhabilitar un casillero en uso. Solicite su liberación primero.');
      (error as any).statusCode = 409;
      throw error;
    }

    // 3. Persistir el nuevo estado operativo
    const updatedLocker = await this.lockerRepository.update(id, {
      status: newStatus
    });

    return updatedLocker;
  }
}

