import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { CreateMedicalCertificateUseCase } from '../application/NewMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from '../application/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from '../application/UpdateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from '../application/DeleteMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';

// Schema de validación de formato para el alta
const createMedicalCertificateSchema = z.object({
    memberId: z.string().uuid('El memberId debe ser un UUID válido'),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de emisión debe estar en formato YYYY-MM-DD'),
    expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de vencimiento debe estar en formato YYYY-MM-DD'),
    doctorLicense: z.string().min(1, 'La matrícula del médico no puede estar vacía'),
}).strict();

// Schema de validación de formato para la modificación
const updateMedicalCertificateSchema = z.object({
    isValidated: z.boolean(),
}).strict();

export class MedicalCertificateController {

    constructor(
    private readonly createMedicalCertificateUseCase: CreateMedicalCertificateUseCase,
    private readonly getMedicalCertificatesUseCase: GetMedicalCertificatesUseCase,
    private readonly updateMedicalCertificateUseCase: UpdateMedicalCertificateUseCase,
    private readonly deleteMedicalCertificateUseCase: DeleteMedicalCertificateUseCase,
) {}

    async getAll(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const certificates = await this.getMedicalCertificatesUseCase.execute();
            return reply.status(200).send({ data: certificates });
        } catch (error: any) {
            return reply.status(500).send({ error: error.message });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateMedicalCertificateRequest }>,
        reply: FastifyReply,
    ) {
        try {
            // 1. Validación de formato con zod
            const parseResult = createMedicalCertificateSchema.safeParse(request.body);
            if (!parseResult.success) {
                const errorMessage = parseResult.error.issues[0]?.message || 'Datos inválidos';
                return reply.status(400).send({ error: errorMessage });
            }

            // 2. Ejecutar caso de uso
            const certificate = await this.createMedicalCertificateUseCase.execute(parseResult.data);
            return reply.status(201).send({ data: certificate });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('debe ser posterior') || error.message.includes('ya pasada')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateMedicalCertificateRequest }>,
    reply: FastifyReply,
    ) {
        try {
            // 1. Validación de formato con zod
            const parseResult = updateMedicalCertificateSchema.safeParse(request.body);
            if (!parseResult.success) {
                const errorMessage = parseResult.error.issues[0]?.message || 'Datos inválidos';
                return reply.status(400).send({ error: errorMessage });
            }

            // 2. Ejecutar caso de uso
            const { id } = request.params;
            const certificate = await this.updateMedicalCertificateUseCase.execute(id, parseResult.data);
            return reply.status(200).send({ data: certificate });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }

    async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            await this.deleteMedicalCertificateUseCase.execute(id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
        }
    }
}