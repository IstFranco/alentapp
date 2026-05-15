import { LoanStatus, LoanStatusVO } from '../value-objects/LoanStatus.js';
import { InvalidStateTransitionError, MissingNotesError } from '../errors/EquipmentLoanErrors.js';

export interface EquipmentLoanProps {
  id: string;
  itemName: string;
  status: LoanStatusVO;
  isActive: boolean;
  loanDate: Date;
  returnDate?: Date;
  canceledDate?: Date;
  memberId: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class EquipmentLoan {
  private constructor(private props: EquipmentLoanProps) {
    this.validate();
  }

  static create(props: Omit<EquipmentLoanProps, 'id' | 'status' | 'isActive' | 'loanDate'>): EquipmentLoan {
    return new EquipmentLoan({
      ...props,
      id: crypto.randomUUID(),
      status: LoanStatusVO.createLoaned(),
      isActive: true,
      loanDate: new Date(),
      returnDate: undefined,
      canceledDate: undefined
    });
  }

  static reconstitute(props: EquipmentLoanProps): EquipmentLoan {
    return new EquipmentLoan(props);
  }

  private validate(): void {
    if (!this.props.itemName || this.props.itemName.trim().length < 3) {
      throw new Error('Item name must be at least 3 characters long');
    }

    if (!this.props.memberId || !this.isValidUUID(this.props.memberId)) {
      throw new Error('Invalid member ID');
    }
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  returnEquipment(notes?: string): void {
    this.validateCanBeReturned();
    
    this.props.status = LoanStatusVO.create(LoanStatus.RETURNED);
    this.props.returnDate = new Date();
    
    if (notes) {
      this.props.notes = notes;
    }
  }

  damageEquipment(notes: string): void {
    this.validateCanBeReturned();
    
    if (!notes || notes.trim().length < 10) {
      throw new MissingNotesError();
    }
    
    this.props.status = LoanStatusVO.create(LoanStatus.DAMAGED);
    this.props.returnDate = new Date();
    this.props.notes = notes.trim();
  }

  private validateCanBeReturned(): void {
    if (this.props.status.isReturned()) {
      throw new InvalidStateTransitionError('Returned');
    }
    
    if (this.props.status.isDamaged()) {
      throw new InvalidStateTransitionError('Damaged');
    }
    
    if (this.props.status.isCanceled()) {
      throw new InvalidStateTransitionError('Canceled');
    }
    
    if (!this.props.isActive) {
      throw new InvalidStateTransitionError('Inactive');
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get itemName(): string {
    return this.props.itemName;
  }

  get status(): LoanStatusVO {
    return this.props.status;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get loanDate(): Date {
    return this.props.loanDate;
  }

  get returnDate(): Date | undefined {
    return this.props.returnDate;
  }

  get canceledDate(): Date | undefined {
    return this.props.canceledDate;
  }

  get memberId(): string {
    return this.props.memberId;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Métodos de consullta
  canBeReturned(): boolean {
    return this.props.status.isLoaned() && this.props.isActive;
  }

  canBeCanceled(): boolean {
    return this.props.status.isLoaned() && this.props.isActive;
  }

  toJSON() {
    return {
      id: this.props.id,
      itemName: this.props.itemName,
      status: this.props.status.getValue(),
      isActive: this.props.isActive,
      loanDate: this.props.loanDate,
      returnDate: this.props.returnDate,
      canceledDate: this.props.canceledDate,
      memberId: this.props.memberId,
      notes: this.props.notes
    };
  }
}
