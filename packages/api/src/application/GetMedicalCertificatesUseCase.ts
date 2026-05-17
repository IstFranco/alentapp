import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO } from '@alentapp/shared';

export class GetMedicalCertificatesUseCase {

    constructor(
        private readonly medicalCertificateRepository: MedicalCertificateRepository
    ) {}

    async execute(): Promise<MedicalCertificateDTO[]> {
        return await this.medicalCertificateRepository.findAll();
    }
}