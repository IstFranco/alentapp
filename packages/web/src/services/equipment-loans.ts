import type { 
    EquipmentLoanResponseDto, 
    CreateEquipmentLoanRequestDto, 
    ReturnEquipmentLoanRequestDto, 
    CancelEquipmentLoanRequestDto 
} from '@alentapp/shared/dtos/equipment-loan.dto';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const equipmentLoansService = {
    async getAll(): Promise<EquipmentLoanResponseDto[]> {
        const response = await fetch(`${API_URL}/equipment-loans`);
        if (!response.ok) {
        throw new Error('Error al obtener los préstamos de equipamiento');
        }
        const result = await response.json();
        // Mapeamos para extraer el array real
        return Array.isArray(result) ? result : (result.data || result);
    },

    async create(data: CreateEquipmentLoanRequestDto): Promise<EquipmentLoanResponseDto> {
        const response = await fetch(`${API_URL}/equipment-loans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        });
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error al crear el préstamo');
        }
        const result = await response.json();
        return result.data || result;
    },

    async returnLoan(id: string, data: ReturnEquipmentLoanRequestDto): Promise<EquipmentLoanResponseDto> {
        const response = await fetch(`${API_URL}/equipment-loans/${id}/return`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        });
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error al devolver el equipamiento');
        }
        const result = await response.json();
        return result.data || result;
    },

    async cancelLoan(id: string, data?: CancelEquipmentLoanRequestDto): Promise<EquipmentLoanResponseDto> {
        const response = await fetch(`${API_URL}/equipment-loans/${id}/cancel`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
        });
        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error al cancelar el préstamo');
        }
        const result = await response.json();
        return result.data || result;
    },
};