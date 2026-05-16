import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { NewLockerUseCase, NewLockerInput } from '../application/NewLockerUseCase';
import { PrismaLockerRepository } from '../infrastructure/PrismaLockerRepository';

export async function LockerController(fastify: FastifyInstance) {
  
  // Instanciamos el repositorio real de Prisma
  const lockerRepository = new PrismaLockerRepository();
  // Se lo inyectamos al caso de uso de aplicación
  const newLockerUseCase = new NewLockerUseCase(lockerRepository);

  // Definimos el endpoint POST para crear el locker
  fastify.post('/lockers', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as NewLockerInput;

      // Validamos rápidamente que nos manden los datos obligatorios
      if (!body.number || !body.location) {
        return reply.status(400).send({ 
          error: 'Faltan datos obligatorios: "number" y "location" son requeridos.' 
        });
      }

      // Ejecutamos la lógica de negocio
      const createdLocker = await newLockerUseCase.execute({
        number: Number(body.number),
        location: body.location
      });

      // Si todo sale bien, devolvemos un 211 (Created) con el locker nuevo
      return reply.status(201).send(createdLocker);

    } catch (error: any) {
      // Si salta el error de número duplicado que programamos en el Caso de Uso, lo atrapamos acá
      return reply.status(400).send({ error: error.message });
    }
  });
}

