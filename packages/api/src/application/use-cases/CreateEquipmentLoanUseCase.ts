import { EquipmentLoan } from '../../domain/entities/EquipmentLoan.js';
import { EquipmentLoanRepository } from '../../domain/ports/EquipmentLoanRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import {
  MemberNotFoundError,
  CategoryRestrictionError,
  InvalidItemNameError,
  InvalidMemberIdError
} from '../../domain/errors/EquipmentLoanErrors.js';
import { CreateEquipmentLoanRequestDto, EquipmentLoanResponseDto } from '@alentapp/shared/dtos/equipment-loan.dto.js';
import { EquipmentLoanMapper } from '../mappers/EquipmentLoanMapper.js';

export class CreateEquipmentLoanUseCase {
  constructor(
    private readonly equipmentLoanRepository: EquipmentLoanRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async execute(request: CreateEquipmentLoanRequestDto): Promise<EquipmentLoanResponseDto> {
    // Validar datos de entrada
    this.validateInput(request);

    // Verificar existencia del socio
    const member = await this.memberRepository.findByDni(request.memberDni);
    if (!member) {
      throw new MemberNotFoundError(request.memberDni);
    }

    // Regla de Negocio: Restricción por Categoría usando el string literal
    if (member.category === 'Cadete') {
      throw new CategoryRestrictionError();
    }

    // Crear entidad de dominio
    const loan = EquipmentLoan.create({
      itemName: request.itemName.trim(),
      memberId: member.id,
      notes: request.notes?.trim()
    });

    // Persistir
    const savedLoan = await this.equipmentLoanRepository.create(loan);

    // Retornar respuesta
    return EquipmentLoanMapper.toResponseDto(savedLoan);
  }

  private validateInput(request: CreateEquipmentLoanRequestDto): void {
    if (!request.itemName || request.itemName.trim().length < 3) {
      throw new InvalidItemNameError();
    }

    if (!request.memberDni || !this.isValidDni(request.memberDni)) {
      throw new Error("El DNI del socio es inválido");
    }
  }

  private isValidDni(dni: string): boolean {
    const dniRegex = /^[0-9]{6,10}$/;
    return dniRegex.test(dni.trim());
  }
}
