import { LockerRepository } from '../domain/LockerRepository.js';

export class DeleteLockerUseCase {
  constructor(private lockerRepository: LockerRepository) {}

  async execute(id: string): Promise<void> {
    // 1. Validar la existencia del casillero
    const locker = await this.lockerRepository.findById(id);
    if (!locker) {
      const error = new Error('Locker no encontrado');
      (error as any).statusCode = 404;
      throw error;
    }

    // 2. Validar que no esté ocupado por un socio
    if (locker.status === 'Occupied') {
      const error = new Error('No se puede eliminar un casillero en uso');
      (error as any).statusCode = 409;
      throw error;
    }

    // 3. Persistir la eliminación física
    await this.lockerRepository.deleteById(id);
  }
}
