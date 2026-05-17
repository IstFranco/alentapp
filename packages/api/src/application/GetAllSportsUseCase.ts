import { SportDTO } from '@alentapp/shared';
import { Sport } from '../domain/Sport.js';
import { SportRepository } from '../domain/SportRepository.js';

export class GetAllSportsUseCase {
    constructor(private readonly sportRepository: SportRepository) {}

    async execute(name?: string): Promise<SportDTO[]> {
        const normalizedName = name?.trim();

        if (name !== undefined && !normalizedName) {
            throw new Error('El parametro de busqueda name no puede estar vacio');
        }

        const sports = await this.sportRepository.findAll(normalizedName);

        if (normalizedName && sports.length === 0) {
            throw new Error('No existen deportes que coincidan con el criterio de busqueda');
        }

        return sports.map((sport) => this.mapToDTO(sport));
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
