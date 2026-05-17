import { describe, expect, it, vi } from 'vitest';
import { CreateSportUseCase } from './CreateSportUseCase.js';

describe('CreateSportUseCase', () => {
    const validInput = {
        name: 'Tenis',
        description: 'Clases y turnos de tenis',
        max_capacity: 20,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    it('crea un deporte cuando los datos son validos y el nombre no existe', async () => {
        const repository = {
            findByName: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: 'sport-id', ...validInput }),
        };
        const useCase = new CreateSportUseCase(repository);

        const result = await useCase.execute(validInput);

        expect(repository.findByName).toHaveBeenCalledWith('Tenis');
        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Tenis',
            max_capacity: 20,
        }));
        expect(result).toEqual({ id: 'sport-id', ...validInput });
    });

    it('rechaza cupos menores o iguales a cero', async () => {
        const repository = {
            findByName: vi.fn(),
            create: vi.fn(),
        };
        const useCase = new CreateSportUseCase(repository);

        await expect(useCase.execute({ ...validInput, max_capacity: 0 }))
            .rejects
            .toThrow('El cupo maximo debe ser un numero entero mayor a cero');
        expect(repository.create).not.toHaveBeenCalled();
    });

    it('rechaza nombres duplicados', async () => {
        const repository = {
            findByName: vi.fn().mockResolvedValue({ id: 'existing-id', ...validInput }),
            create: vi.fn(),
        };
        const useCase = new CreateSportUseCase(repository);

        await expect(useCase.execute(validInput))
            .rejects
            .toThrow('Ya existe un deporte con ese nombre');
        expect(repository.create).not.toHaveBeenCalled();
    });
});
