import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';
import { GetAllSportsUseCase } from '../application/GetAllSportsUseCase.js';
import { UpdateSportUseCase } from '../application/UpdateSportUseCase.js';
import { DeleteSportUseCase } from '../application/DeleteSportUseCase.js';

const createSportSchema = z.object({
    name: z.string().trim().min(1, 'El nombre del deporte es obligatorio'),
    description: z.string().default(''),
    max_capacity: z.coerce.number().int('El cupo maximo debe ser un numero entero').positive('El cupo maximo debe ser mayor a cero'),
    additional_price: z.coerce.number().min(0, 'El precio adicional no puede ser negativo').default(0),
    requires_medical_certificate: z.boolean(),
}).strict();

const updateSportSchema = z.object({
    description: z.string().optional(),
    max_capacity: z.coerce.number().int('El cupo maximo debe ser un numero entero').positive('El cupo maximo debe ser mayor a cero').optional(),
}).passthrough();

const sportIdParamsSchema = z.object({
    id: z.string().uuid('El formato del id del deporte no es valido'),
});

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly getAllSportsUseCase: GetAllSportsUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
        private readonly deleteSportUseCase: DeleteSportUseCase,
    ) {}

    async getAll(
        request: FastifyRequest<{ Querystring: { name?: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const sports = await this.getAllSportsUseCase.execute(request.query.name);
            return reply.status(200).send({ data: sports });
        } catch (error: any) {
            if (error.message.includes('no puede estar vacio')) {
                return reply.status(400).send({ error: error.message });
            }
            if (error.message.includes('No existen deportes')) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente mas tarde' });
        }
    }

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const parseResult = createSportSchema.safeParse(request.body);
            if (!parseResult.success) {
                const errorMessage = parseResult.error.issues[0]?.message || 'Datos invalidos';
                return reply.status(400).send({ error: errorMessage });
            }

            const sport = await this.createSportUseCase.execute(parseResult.data);
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Ya existe')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('obligatorio') || error.message.includes('cupo') || error.message.includes('precio')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente mas tarde' });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateSportRequest & { name?: unknown } }>,
        reply: FastifyReply,
    ) {
        try {
            const parseResult = updateSportSchema.safeParse(request.body);
            if (!parseResult.success) {
                const errorMessage = parseResult.error.issues[0]?.message || 'Datos invalidos';
                return reply.status(400).send({ error: errorMessage });
            }

            const sport = await this.updateSportUseCase.execute(request.params.id, parseResult.data);
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('nombre') || error.message.includes('cupo')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente mas tarde' });
        }
    }

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply,
    ) {
        try {
            const parseResult = sportIdParamsSchema.safeParse(request.params);
            if (!parseResult.success) {
                const errorMessage = parseResult.error.issues[0]?.message || 'Id invalido';
                return reply.status(400).send({ error: errorMessage });
            }

            await this.deleteSportUseCase.execute(parseResult.data.id);
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(500).send({ error: 'Error interno, reintente mas tarde' });
        }
    }
}
