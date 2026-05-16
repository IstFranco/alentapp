import { Locker } from '../domain/Locker';
import { LockerRepository } from '../domain/LockerRepository';

export interface NewLockerInput {
  number: number;
  location: string;
}

export class NewLockerUseCase {
  constructor(private readonly lockerRepository: LockerRepository) {}

  async execute(input: NewLockerInput): Promise<Locker> {
    // 1. Validar si ya existe un casillero con ese número
    const existingLocker = await this.lockerRepository.findByNumber(input.number);
    if (existingLocker) {
      throw new Error(`El casillero número ${input.number} ya se encuentra registrado.`);
    }

    // 2. Instanciar el nuevo Locker con estado inicial 'Available'
    const newLocker = new Locker(
      '', // El id se autogenera en la base de datos
      input.number,
      input.location,
      'Available',
      null // Arranca sin miembro asignado
    );

    // 3. Mandarlo a guardar mediante el repositorio
    return await this.lockerRepository.save(newLocker);
  }
}

