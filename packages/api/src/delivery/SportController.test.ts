import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SportController } from './SportController.js';

describe('SportController', () => {
    const createUseCase = { execute: vi.fn() };
    const getAllUseCase = { execute: vi.fn() };
    const controller = new SportController(createUseCase as any, getAllUseCase as any);
    const reply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('devuelve 201 cuando se crea el deporte', async () => {
        const sport = {
            id: 'sport-id',
            name: 'Tenis',
            description: 'Clases de tenis',
            max_capacity: 20,
            additional_price: 1000,
            requires_medical_certificate: true,
        };
        createUseCase.execute.mockResolvedValueOnce(sport);

        await controller.create({
            body: {
                name: sport.name,
                description: sport.description,
                max_capacity: sport.max_capacity,
                additional_price: sport.additional_price,
                requires_medical_certificate: sport.requires_medical_certificate,
            },
        } as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(201);
        expect(reply.send).toHaveBeenCalledWith({ data: sport });
    });

    it('devuelve 400 cuando el cupo es invalido', async () => {
        await controller.create({
            body: {
                name: 'Tenis',
                description: 'Clases de tenis',
                max_capacity: 0,
                additional_price: 1000,
                requires_medical_certificate: true,
            },
        } as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(400);
        expect(createUseCase.execute).not.toHaveBeenCalled();
    });

    it('devuelve 409 cuando el nombre esta duplicado', async () => {
        createUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un deporte con ese nombre'));

        await controller.create({
            body: {
                name: 'Tenis',
                description: 'Clases de tenis',
                max_capacity: 20,
                additional_price: 1000,
                requires_medical_certificate: true,
            },
        } as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(409);
    });

    it('devuelve 200 y la lista de deportes', async () => {
        const sports = [{
            id: 'sport-id',
            name: 'Tenis',
            description: 'Clases de tenis',
            max_capacity: 20,
            additional_price: 1000,
            requires_medical_certificate: true,
        }];
        getAllUseCase.execute.mockResolvedValueOnce(sports);

        await controller.getAll({ query: {} } as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(200);
        expect(reply.send).toHaveBeenCalledWith({ data: sports });
    });

    it('devuelve 400 cuando el filtro name esta vacio', async () => {
        getAllUseCase.execute.mockRejectedValueOnce(new Error('El parametro de busqueda name no puede estar vacio'));

        await controller.getAll({ query: { name: ' ' } } as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(400);
    });

    it('devuelve 404 cuando no hay resultados para el filtro', async () => {
        getAllUseCase.execute.mockRejectedValueOnce(new Error('No existen deportes que coincidan con el criterio de busqueda'));

        await controller.getAll({ query: { name: 'Rugby' } } as any, reply as any);

        expect(reply.status).toHaveBeenCalledWith(404);
    });
});
