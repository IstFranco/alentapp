import { EquipmentLoanRepository } from '../../domain/ports/EquipmentLoanRepository.js';
import { LoanNotFoundError } from '../../domain/errors/EquipmentLoanErrors.js';
import { CancelEquipmentLoanRequestDto, EquipmentLoanResponseDto } from '@alentapp/shared/dtos/equipment-loan.dto.js';
import { EquipmentLoanMapper } from '../mappers/EquipmentLoanMapper.js';

export class CancelEquipmentLoanUseCase {
    constructor(
        private readonly equipmentLoanRepository: EquipmentLoanRepository
    ) {}

    async execute(loanId: string, request: CancelEquipmentLoanRequestDto): Promise<EquipmentLoanResponseDto> {
        // Buscar el préstamo
        const loan = await this.equipmentLoanRepository.findById(loanId);
        if (!loan) {
        throw new LoanNotFoundError(loanId);
        }

        // Aplicar baja lógica
        loan.cancelEquipment(request.reason);

        // Persistir cambios
        const canceledLoan = await this.equipmentLoanRepository.update(loan);

        // Retornar respuesta
        return EquipmentLoanMapper.toResponseDto(canceledLoan);
    }
}