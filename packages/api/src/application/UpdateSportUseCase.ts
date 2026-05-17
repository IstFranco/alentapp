import { SportDTO, UpdateSportRequest } from '@alentapp/shared';
import { Sport } from '../domain/Sport.js';
import { SportRepository } from '../domain/SportRepository.js';

export class UpdateSportUseCase {
    constructor(private readonly sportRepository: SportRepository) {}

    async execute(id: string, data: UpdateSportRequest & { name?: unknown }): Promise<SportDTO> {
        if ('name' in data) {
            throw new Error('No se permite modificar el nombre del deporte');
        }

        const existingSport = await this.sportRepository.findById(id);
        if (!existingSport) {
            throw new Error('El deporte no existe');
        }

        if (data.max_capacity !== undefined && (!Number.isInteger(data.max_capacity) || data.max_capacity <= 0)) {
            throw new Error('El cupo maximo debe ser un numero entero mayor a cero');
        }

        const updateData: Partial<Omit<Sport, 'id' | 'name'>> = {};

        if (data.description !== undefined) {
            updateData.description = data.description.trim();
        }

        if (data.max_capacity !== undefined) {
            updateData.max_capacity = data.max_capacity;
        }

        const updated = await this.sportRepository.update(id, updateData);
        return this.mapToDTO(updated);
    }

    private mapToDTO(sport: Sport): SportDTO {
        return {
            id: sport.id,
            name: sport.name,
            description: sport.description,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
        };
    }
}
