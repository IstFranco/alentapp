import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { LockerController } from './delivery/LockerController.js';
import { PrismaLockerRepository } from './infrastructure/PrismaLockerRepository.js';
import { NewLockerUseCase } from './application/NewLockerUseCase.js';
import { DeleteLockerUseCase } from './application/DeleteLockerUseCase.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';

// NUEVOS IMPORTS PARA ESTE TDD
import { ReserveLockerUseCase } from './application/ReserveLockerUseCase.js';
import { ReleaseLockerUseCase } from './application/ReleaseLockerUseCase.js';
import { UpdateLockerStatusUseCase } from './application/UpdateLockerStatusUseCase.js';

// ESQUEMAS DE VALIDACIÓN ZOD (DTOs)
const IdParamSchema = z.object({
  id: z.string().uuid({ message: 'El formato del ID de locker no es válido (debe ser UUID)' })
});

const ReserveLockerBodySchema = z.object({
  member_id: z.string().uuid({ message: 'El formato del member_id no es válido (debe ser UUID)' })
});

const UpdateLockerStatusBodySchema = z.object({
  status: z.enum(['Available', 'Maintenance'], { 
    errorMap: () => ({ message: 'El estado debe ser estrictamente Available o Maintenance' }) 
  })
});

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development' 
            ? {
                target: 'pino-pretty',
                options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                } 
            : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);
    
    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);
    
    const lockerRepo = new PrismaLockerRepository();
    const newLockerUseCase = new NewLockerUseCase(lockerRepo);
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);
    
    // INSTANCIACIÓN DE NUEVOS CASOS DE USO
    const reserveLockerUseCase = new ReserveLockerUseCase(lockerRepo);
    const releaseLockerUseCase = new ReleaseLockerUseCase(lockerRepo);
    const updateLockerStatusUseCase = new UpdateLockerStatusUseCase(lockerRepo);

    const memberController = new MemberController(
        createMemberUseCase, 
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );

    // RUTAS SOCIOS
    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));
    
    // RUTAS LOCKERS (EXISTENTES)
    server.post('/api/v1/lockers', async (request, reply) => {
        const body = request.body as any;
        const result = await newLockerUseCase.execute({
            number: Number(body.number),
            location: body.location
        });
        return reply.status(201).send(result);
    });

    server.delete('/api/v1/lockers/:id', async (request, reply) => {
        try {
            const result = IdParamSchema.safeParse(request.params);
            if (!result.success) {
                return reply.status(400).send({ error: result.error.errors[0].message });
            }
            await deleteLockerUseCase.execute(result.data.id);
            return reply.status(204).send();
        } catch (error: any) {
            const statusCode = error.statusCode || 500;
            return reply.status(statusCode).send({ error: error.message });
        }
    });

    // ==========================================
    // NUEVOS ENDPOINTS DE ACTUALIZACIÓN (TDD-0009)
    // ==========================================

   // 1. Reservar Casillero
    server.patch('/api/v1/lockers/:id/reserve', async (request, reply) => {
        try {
            const { id } = request.params as any;
            const { member_id } = request.body as any;

            // Vamos directo al caso de uso
            const result = await reserveLockerUseCase.execute(id, member_id);
            return reply.status(200).send(result);
        } catch (error: any) {
            console.error("=== EXCEPCIÓN REAL EN CASO DE USO ===", error);
            return reply.status(error.statusCode || 500).send({ error: error.message });
        }
    });
   
 // 2. Liberar Casillero
    server.patch('/api/v1/lockers/:id/release', async (request, reply) => {
        try {
            const paramResult = IdParamSchema.safeParse(request.params);
            if (!paramResult.success) return reply.status(400).send({ error: paramResult.error.errors[0].message });

            // Simulación de extracción del member_id de la sesión mediante JWT Mock en req.body para el testeo básico
            const sessionMemberId = (request.body as any)?.session_member_id || (request.headers as any)['x-user-id'];
            if (!sessionMemberId) return reply.status(401).send({ error: 'No autenticado.' });

            const result = await releaseLockerUseCase.execute(paramResult.data.id, sessionMemberId);
            return reply.status(200).send(result);
        } catch (error: any) {
            return reply.status(error.statusCode || 500).send({ error: error.message });
        }
    });

    // 3. Actualizar Estado Operativo (Mantenimiento / Disponible)
    server.patch('/api/v1/lockers/:id/status', async (request, reply) => {
        try {
            const paramResult = IdParamSchema.safeParse(request.params);
            const bodyResult = UpdateLockerStatusBodySchema.safeParse(request.body);
            
            if (!paramResult.success) return reply.status(400).send({ error: paramResult.error.errors[0].message });
            if (!bodyResult.success) return reply.status(400).send({ error: bodyResult.error.errors[0].message });

            const result = await updateLockerStatusUseCase.execute(paramResult.data.id, bodyResult.data.status);
            return reply.status(200).send(result);
        } catch (error: any) {
            return reply.status(error.statusCode || 500).send({ error: error.message });
        }
    });

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}
