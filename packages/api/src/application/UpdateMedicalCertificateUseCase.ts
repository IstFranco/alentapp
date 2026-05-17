import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, UpdateMedicalCertificateRequest } from '@alentapp/shared';

export class UpdateMedicalCertificateUseCase {

    constructor(
        private readonly medicalCertificateRepository: MedicalCertificateRepository
    ) {}

    async execute(id: string, data: UpdateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        // 1. Verificar que el certificado existe
        const existing = await this.medicalCertificateRepository.findById(id);
        if (!existing) {
            throw new Error('El certificado médico no existe');
        }

        // 2. Modificar el estado de validación
        const updated = await this.medicalCertificateRepository.updateValidationStatus(id, data.isValidated);

        return updated;
    }
}