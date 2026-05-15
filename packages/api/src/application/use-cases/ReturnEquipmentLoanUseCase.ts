import { EquipmentLoanRepository } from '../../domain/ports/EquipmentLoanRepository.js';
import {
    LoanNotFoundError,
    InvalidStatusError,
    MissingNotesError
} from '../../domain/errors/EquipmentLoanErrors.js';
import { ReturnEquipmentLoanRequestDto, EquipmentLoanResponseDto } from '@alentapp/shared/dtos/equipment-loan.dto';
import { EquipmentLoanMapper } from '../mappers/EquipmentLoanMapper.js';

export class ReturnEquipmentLoanUseCase {
    constructor(
        private readonly equipmentLoanRepository: EquipmentLoanRepository
    ) {}

    async execute(loanId: string, request: ReturnEquipmentLoanRequestDto): Promise<EquipmentLoanResponseDto> {
    // Validar datos de entrada
    this.validateInput(request);

    // Buscar el préstamo
    const loan = await this.equipmentLoanRepository.findById(loanId);
    if (!loan) {
        throw new LoanNotFoundError(loanId);
    }

    // Aplicar regla de negocio según el estado solicitado
    if (request.status === 'Returned') {
        loan.returnEquipment(request.notes);
    } else if (request.status === 'Damaged') {
      // La entidad ya valida que las notas sean obligatorias
        loan.damageEquipment(request.notes!);
    } else {
        throw new InvalidStatusError(request.status);
    }

    // Persistir cambios
    const updatedLoan = await this.equipmentLoanRepository.update(loan);

    // Retornar respuesta
    return EquipmentLoanMapper.toResponseDto(updatedLoan);
    }

    private validateInput(request: ReturnEquipmentLoanRequestDto): void {
        // Validar que el estado sea válido
        if (request.status !== 'Returned' && request.status !== 'Damaged') {
        throw new InvalidStatusError(request.status);
        }

        // Validar que si es Damaged, tenga notas
        if (request.status === 'Damaged') {
            if (!request.notes || request.notes.trim().length < 10) {
                throw new MissingNotesError();
            }
        }
    }
}