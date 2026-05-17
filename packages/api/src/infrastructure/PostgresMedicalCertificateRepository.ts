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

    async findAll(): Promise<MedicalCertificateDTO[]> {
        const certificates = await prisma.medicalCertificate.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: {
                issueDate: 'desc',
            },
        });

        return certificates.map((cert) => this.mapToDTO(cert));
    }

    async findById(id: string): Promise<MedicalCertificateDTO | null> {
        const certificate = await prisma.medicalCertificate.findUnique({
            where: { id },
        });

        if (!certificate || certificate.deletedAt !== null) {
            return null;
        }

        return this.mapToDTO(certificate);
    }

    async updateValidationStatus(id: string, isValidated: boolean): Promise<MedicalCertificateDTO> {
        const updated = await prisma.medicalCertificate.update({
            where: { id },
            data: { isValidated },
        });

        return this.mapToDTO(updated);
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