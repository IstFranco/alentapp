import { MemberRepository } from '../MemberRepository.js';

export class MedicalCertificateValidator {

    constructor(private readonly memberRepo: MemberRepository) {}

    validateDateRange(issueDate: Date, expiryDate: Date): void {
        if (expiryDate <= issueDate) {
            throw new Error('La fecha de vencimiento debe ser posterior a la de emisión');
        }
    }

    validateNotExpiredOnCreation(expiryDate: Date): void {
        const now = new Date();
        if (expiryDate < now) {
            throw new Error('El certificado no puede tener una fecha de vencimiento ya pasada');
        }
    }

    async validateMemberExists(memberId: string): Promise<void> {
        const member = await this.memberRepo.findById(memberId);
        if (!member) {
            throw new Error('El socio referenciado no existe');
        }
    }
}