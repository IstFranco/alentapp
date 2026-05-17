import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { NewLockerUseCase, NewLockerInput } from '../application/NewLockerUseCase.js';
import { DeleteLockerUseCase } from '../application/DeleteLockerUseCase.js';
import { PrismaLockerRepository } from '../infrastructure/PrismaLockerRepository.js';

// Definimos el esquema de Zod para validar que el id de los parámetros sea un UUID válido
const DeleteLockerParamsSchema = z.object({
  id: z.string().uuid({ message: 'El formato del ID de locker no es válido (debe ser UUID)' })
});

export async function LockerController(fastify: FastifyInstance) {
  
  const lockerRepository = new PrismaLockerRepository();
  const newLockerUseCase = new NewLockerUseCase(lockerRepository);
  const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepository);

  // 1. Endpoint POST para crear el locker
  fastify.post('/lockers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as NewLockerInput;

      if (!body.number || !body.location) {
        return reply.status(400).send({ 
          error: 'Faltan datos obligatorios: "number" y "location" son requeridos.' 
        });
      }

      const createdLocker = await newLockerUseCase.execute({
        number: Number(body.number),
        location: body.location
      });

      return reply.status(201).send(createdLocker);

    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  // 2. Endpoint DELETE para dar de baja un locker (Cumpliendo el Flujo TDD con Zod)
  fastify.delete('/lockers/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validamos los parámetros de la request usando el esquema de Zod
      const result = DeleteLockerParamsSchema.safeParse(request.params);

      // Si Zod detecta que no es un UUID válido, frena el flujo y devuelve 400
      if (!result.success) {
        const firstError = result.error.errors[0].message;
        return reply.status(400).send({ error: firstError });
      }

      // Si pasó la validación, extraemos el id seguro
      const { id } = result.data;

      // Ejecutamos el caso de uso
      await deleteLockerUseCase.execute(id);

      // Si todo sale bien, respondemos con 204 No Content
      return reply.status(204).send();

    } catch (error: any) {
      // Atrapamos los códigos de error del caso de uso (404 o 409)
      const statusCode = error.statusCode || 500;
      return reply.status(statusCode).send({ error: error.message });
    }
  });
}
