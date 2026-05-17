import { describe, expect, it, vi } from 'vitest';
import { GetAllSportsUseCase } from './GetAllSportsUseCase.js';

describe('GetAllSportsUseCase', () => {
    const sport = {
        id: 'sport-id',
        name: 'Tenis',
        description: 'Clases y turnos de tenis',
        max_capacity: 20,
        additional_price: 1500,
        requires_medical_certificate: true,
    };

    it('lista todos los deportes sin filtro', async () => {
        const repository = {
            findAll: vi.fn().mockResolvedValue([sport]),
        };
        const useCase = new GetAllSportsUseCase(repository as any);

        const result = await useCase.execute();

        expect(repository.findAll).toHaveBeenCalledWith(undefined);
        expect(result).toEqual([sport]);
    });

    it('lista deportes filtrando por nombre', async () => {
        const repository = {
            findAll: vi.fn().mockResolvedValue([sport]),
        };
        const useCase = new GetAllSportsUseCase(repository as any);

        const result = await useCase.execute(' Ten ');

        expect(repository.findAll).toHaveBeenCalledWith('Ten');
        expect(result).toEqual([sport]);
    });

    it('rechaza busquedas con name vacio', async () => {
        const repository = {
            findAll: vi.fn(),
        };
        const useCase = new GetAllSportsUseCase(repository as any);

        await expect(useCase.execute('   '))
            .rejects
            .toThrow('El parametro de busqueda name no puede estar vacio');
        expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('rechaza filtros sin resultados', async () => {
        const repository = {
            findAll: vi.fn().mockResolvedValue([]),
        };
        const useCase = new GetAllSportsUseCase(repository as any);

        await expect(useCase.execute('Rugby'))
            .rejects
            .toThrow('No existen deportes que coincidan con el criterio de busqueda');
    });
});
