import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../domain/services/MedicalCertificateValidator.js';
import { MedicalCertificateDTO, CreateMedicalCertificateRequest } from '@alentapp/shared';

export class CreateMedicalCertificateUseCase {

    constructor(
        private readonly medicalCertificateRepository: MedicalCertificateRepository,
        private readonly medicalCertificateValidator: MedicalCertificateValidator
    ) {}

    async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        // 1. Convertir strings a Date para las validaciones
        const issueDate = new Date(data.issueDate);
        const expiryDate = new Date(data.expiryDate);

        // 2. Validaciones de reglas de negocio
        this.medicalCertificateValidator.validateDateRange(issueDate, expiryDate);
        this.medicalCertificateValidator.validateNotExpiredOnCreation(expiryDate);
        await this.medicalCertificateValidator.validateMemberExists(data.memberId);

        // 3. Persistencia atómica (crear + invalidar anteriores)
        const newCertificate = await this.medicalCertificateRepository.createAndInvalidatePrevious(data);

        return newCertificate;
    }
}