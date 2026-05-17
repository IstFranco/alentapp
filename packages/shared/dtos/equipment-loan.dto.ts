export interface CreateEquipmentLoanRequestDto {
  itemName: string;
  memberDNI: string;
  notes?: string;
}

export interface EquipmentLoanResponseDto {
  id: string;
  itemName: string;
  status: 'Loaned' | 'Returned' | 'Damaged' | 'Canceled';
  loanDate: string;
  returnDate: string | null;
  memberId: string;
  notes?: string;
}

export interface EquipmentLoanErrorDto {
  error: string;
  message: string;
  code: string;
}

export interface ReturnEquipmentLoanRequestDto {
  status: 'Returned' | 'Damaged';
  notes?: string;
}

export interface EquipmentLoanResponseDto {
  id: string;
  itemName: string;
  status: 'Loaned' | 'Returned' | 'Damaged' | 'Canceled';
  loanDate: string;
  returnDate: string | null;
  memberId: string;
  notes?: string;
}

export interface EquipmentLoanErrorDto {
  error: string;
  message: string;
  code: string;
}

export interface CancelEquipmentLoanRequestDto {
  reason?: string;
}

export interface EquipmentLoanResponseDto {
  id: string;
  itemName: string;
  status: 'Loaned' | 'Returned' | 'Damaged' | 'Canceled';
  isActive: boolean;
  loanDate: string;
  returnDate: string | null;
  canceledDate: string | null;
  memberId: string;
  notes?: string;
}

export interface EquipmentLoanErrorDto {
  error: string;
  message: string;
  code: string;
}