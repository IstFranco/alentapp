import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

export class DeleteMedicalCertificateUseCase {

    constructor(
        private readonly medicalCertificateRepository: MedicalCertificateRepository
    ) {}

    async execute(id: string): Promise<void> {
        // 1. Verificar que el certificado existe (y no fue ya eliminado)
        const existing = await this.medicalCertificateRepository.findById(id);
        if (!existing) {
            throw new Error('El certificado médico no existe');
        }

        // 2. Marcar como eliminado lógicamente
        await this.medicalCertificateRepository.softDelete(id);
    }
}