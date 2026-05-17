import { MedicalCertificateDTO, CreateMedicalCertificateRequest } from '@alentapp/shared';

export interface MedicalCertificateRepository {
    createAndInvalidatePrevious(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO>;
    findAll(): Promise<MedicalCertificateDTO[]>;
}