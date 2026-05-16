import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';
import { MedicalCertificateDTO, CreateMedicalCertificateRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBMedicalCertificate = {
    id: string;
    memberId: string;
    issueDate: Date;
    expiryDate: Date;
    doctorLicense: string;
    isValidated: boolean;
    deletedAt: Date | null;
};

export class PostgresMedicalCertificateRepository implements MedicalCertificateRepository {

    async createAndInvalidatePrevious(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateDTO> {
        const newCertificate = await prisma.$transaction(async (tx) => {
            // 1. Invalida los certificados activos previos del socio
            await tx.medicalCertificate.updateMany({
                where: {
                    memberId: data.memberId,
                    isValidated: true,
                    deletedAt: null,
                },
                data: {
                    isValidated: false,
                },
            });

            // 2. Crea el nuevo certificado
            const created = await tx.medicalCertificate.create({
                data: {
                    memberId: data.memberId,
                    issueDate: new Date(data.issueDate),
                    expiryDate: new Date(data.expiryDate),
                    doctorLicense: data.doctorLicense,
                },
            });

            return created;
        });

        return this.mapToDTO(newCertificate);
    }

    private mapToDTO(cert: DBMedicalCertificate): MedicalCertificateDTO {
        return {
            id: cert.id,
            memberId: cert.memberId,
            issueDate: cert.issueDate.toISOString().split('T')[0],
            expiryDate: cert.expiryDate.toISOString().split('T')[0],
            doctorLicense: cert.doctorLicense,
            isValidated: cert.isValidated,
        };
    }
}