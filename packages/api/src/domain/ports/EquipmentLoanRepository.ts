import { EquipmentLoan } from '../entities/EquipmentLoan.js';

export interface EquipmentLoanRepository {

  create(loan: EquipmentLoan): Promise<EquipmentLoan>;

  findById(id: string): Promise<EquipmentLoan | null>;

  update(loan: EquipmentLoan): Promise<EquipmentLoan>;

  findAll(): Promise<EquipmentLoan[]>;
}
