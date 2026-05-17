import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { CreateSportRequest } from '@alentapp/shared';
import { CreateSportUseCase } from '../application/CreateSportUseCase.js';

const createSportSchema = z.object({
    name: z.string().trim().min(1, 'El nombre del deporte es obligatorio'),
    description: z.string().default(''),
    max_capacity: z.coerce.number().int('El cupo maximo debe ser un numero entero').positive('El cupo maximo debe ser mayor a cero'),
    additional_price: z.coerce.number().min(0, 'El precio adicional no puede ser negativo').default(0),
    requires_medical_certificate: z.boolean(),
}).strict();

export class SportController {
    constructor(private readonly createSportUseCase: CreateSportUseCase) {}

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
}
