export class EquipmentLoanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EquipmentLoanError';
  }
}

export class MemberNotFoundError extends EquipmentLoanError {
  constructor(memberId: string) {
    super(`El socio con ID ${memberId} no existe`);
    this.name = 'MemberNotFoundError';
  }
}

export class CategoryRestrictionError extends EquipmentLoanError {
  constructor() {
    super('Los socios de categoría Cadet no están autorizados para solicitar préstamos de equipamiento');
    this.name = 'CategoryRestrictionError';
  }
}

export class InvalidItemNameError extends EquipmentLoanError {
  constructor() {
    super('El nombre del ítem debe tener al menos 3 caracteres');
    this.name = 'InvalidItemNameError';
  }
}

export class InvalidMemberIdError extends EquipmentLoanError {
  constructor() {
    super('El ID del socio es inválido');
    this.name = 'InvalidMemberIdError';
  }
}

export class LoanNotFoundError extends EquipmentLoanError {
  constructor(loanId: string) {
    super(`El préstamo con ID ${loanId} no existe`);
    this.name = 'LoanNotFoundError';
  }
}

export class InvalidStateTransitionError extends EquipmentLoanError {
  constructor(currentStatus: string) {
    super(`Este préstamo ya fue devuelto anteriormente (estado actual: ${currentStatus})`);
    this.name = 'InvalidStateTransitionError';
  }
}

export class MissingNotesError extends EquipmentLoanError {
  constructor() {
    super('Si el material está dañado, debe proporcionar notas explicativas');
    this.name = 'MissingNotesError';
  }
}

export class InvalidStatusError extends EquipmentLoanError {
  constructor(status: string) {
    super(`El estado '${status}' no es válido para devolución. Use 'Returned' o 'Damaged'`);
    this.name = 'InvalidStatusError';
  }
}