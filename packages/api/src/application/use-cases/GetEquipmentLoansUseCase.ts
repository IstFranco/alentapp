import { EquipmentLoanRepository } from '../../domain/ports/EquipmentLoanRepository.js';
import { EquipmentLoanResponseDto } from '@alentapp/shared/dtos/equipment-loan.dto.js';
import { EquipmentLoanMapper } from '../mappers/EquipmentLoanMapper.js';

export class GetEquipmentLoansUseCase {
    constructor(
        private readonly equipmentLoanRepository: EquipmentLoanRepository
    ) {}

    async execute(): Promise<EquipmentLoanResponseDto[]> {
        // Obtener todos los préstamos activos
        const loans = await this.equipmentLoanRepository.findAll();

        // Mapear a DTOs
        return loans.map(loan => EquipmentLoanMapper.toResponseDto(loan));
    }
}