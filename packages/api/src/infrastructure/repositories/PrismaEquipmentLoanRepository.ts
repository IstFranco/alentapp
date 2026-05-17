import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../generated/client/index.js');

import { EquipmentLoan } from '../../domain/entities/EquipmentLoan.js';
import { EquipmentLoanRepository } from '../../domain/ports/EquipmentLoanRepository.js';
import { EquipmentLoanMapper } from '../../application/mappers/EquipmentLoanMapper.js';
import { LoanStatusVO } from '../../domain/value-objects/LoanStatus.js';

export class PrismaEquipmentLoanRepository implements EquipmentLoanRepository {
  constructor(private readonly prisma: any) {}
  
  async create(loan: EquipmentLoan): Promise<EquipmentLoan> {
    const data = {
      id: loan.id,
      itemName: loan.itemName,
      status: loan.status.getValue(),
      isActive: loan.isActive,
      loanDate: loan.loanDate,
      returnDate: loan.returnDate,
      canceledDate: loan.canceledDate,
      memberId: loan.memberId,
      notes: loan.notes
    };

    const created = await this.prisma.equipmentLoan.create({
      data
    });

    return EquipmentLoanMapper.toDomain(created);
  }

  async findById(id: string): Promise<EquipmentLoan | null> {
    const loan = await this.prisma.equipmentLoan.findUnique({
      where: { id }
    });

    if (!loan) {
      return null;
    }

    return EquipmentLoanMapper.toDomain(loan);
  }

  async update(loan: EquipmentLoan): Promise<EquipmentLoan> {
    const data = {
      itemName: loan.itemName,
      status: loan.status.getValue(),
      isActive: loan.isActive,
      returnDate: loan.returnDate,
      canceledDate: loan.canceledDate,
      notes: loan.notes
    };

    const updated = await this.prisma.equipmentLoan.update({
      where: { id: loan.id },
      data
    });

    return EquipmentLoanMapper.toDomain(updated);
  }

  async findAll(): Promise<EquipmentLoan[]> {
    const loans = await this.prisma.equipmentLoan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        loanDate: 'desc'
      }
    });

    return loans.map(loan => EquipmentLoan.reconstitute({
      id: loan.id,
      itemName: loan.itemName,
      status: LoanStatusVO.create(loan.status),
      isActive: loan.isActive,
      loanDate: loan.loanDate,
      returnDate: loan.returnDate || undefined,
      canceledDate: loan.canceledDate || undefined,
      memberId: loan.memberId,
      notes: loan.notes || undefined,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt
    }));
  }
}