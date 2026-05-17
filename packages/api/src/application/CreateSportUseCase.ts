import { CreateSportRequest, SportDTO } from '@alentapp/shared';
import { Sport } from '../domain/Sport.js';
import { SportRepository } from '../domain/SportRepository.js';

export class CreateSportUseCase {
    constructor(private readonly sportRepository: SportRepository) {}

    async execute(data: CreateSportRequest): Promise<SportDTO> {
        const name = data.name.trim();
        const description = data.description.trim();
        const additionalPrice = data.additional_price ?? 0;

        if (!name) {
            throw new Error('El nombre del deporte es obligatorio');
        }

        if (!Number.isInteger(data.max_capacity) || data.max_capacity <= 0) {
            throw new Error('El cupo maximo debe ser un numero entero mayor a cero');
        }

        if (additionalPrice < 0) {
            throw new Error('El precio adicional no puede ser negativo');
        }

        const existingSport = await this.sportRepository.findByName(name);
        if (existingSport) {
            throw new Error('Ya existe un deporte con ese nombre');
        }

        const sport = new Sport(
            '',
            name,
            description,
            data.max_capacity,
            additionalPrice,
            data.requires_medical_certificate,
        );

        const created = await this.sportRepository.create(sport);
        return this.mapToDTO(created);
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
