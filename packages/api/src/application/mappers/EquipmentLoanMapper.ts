import { EquipmentLoan } from '../../domain/entities/EquipmentLoan.js';
import { EquipmentLoanResponseDto } from '@alentapp/shared/dtos/equipment-loan.dto.js';
import { LoanStatusVO } from '../../domain/value-objects/LoanStatus.js';

export class EquipmentLoanMapper {
  static toResponseDto(loan: EquipmentLoan): EquipmentLoanResponseDto {
    return {
      id: loan.id,
      itemName: loan.itemName,
      status: loan.status.getValue(),
      isActive: loan.isActive,
      loanDate: loan.loanDate.toISOString(),
      returnDate: loan.returnDate ? loan.returnDate.toISOString() : null,
      canceledDate: loan.canceledDate ? loan.canceledDate.toISOString() : null,
      memberId: loan.memberId,
      notes: loan.notes
    };
  }

  static toDomain(raw: any): EquipmentLoan {
    return EquipmentLoan.reconstitute({
      id: raw.id,
      itemName: raw.itemName,
      status: LoanStatusVO.create(raw.status),
      isActive: raw.isActive,
      loanDate: new Date(raw.loanDate),
      returnDate: raw.returnDate ? new Date(raw.returnDate) : undefined,
      canceledDate: raw.canceledDate ? new Date(raw.canceledDate) : undefined,
      memberId: raw.memberId,
      notes: raw.notes,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : undefined
    });
  }
}
