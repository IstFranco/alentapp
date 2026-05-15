import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEquipmentLoanUseCase } from '../../application/use-cases/CreateEquipmentLoanUseCase.js';
import { ReturnEquipmentLoanUseCase } from '../../application/use-cases/ReturnEquipmentLoanUseCase.js';
import { CreateEquipmentLoanBody, ReturnEquipmentLoanBody, ReturnEquipmentLoanParams } from '../validators/EquipmentLoanValidators.js';
import { CreateEquipmentLoanBody } from '../validators/EquipmentLoanValidators.js';
import {
  MemberNotFoundError,
  CategoryRestrictionError,
  InvalidItemNameError,
  InvalidMemberIdError,
  InvalidStateTransitionError,
  MissingNotesError,
  InvalidStatusError
} from '../../domain/errors/EquipmentLoanErrors.js';

export class EquipmentLoanController {
  constructor(
    private readonly createEquipmentLoanUseCase: CreateEquipmentLoanUseCase,
    private readonly returnEquipmentLoanUseCase: ReturnEquipmentLoanUseCase
  ) {}

  async create(
    request: FastifyRequest<{ Body: CreateEquipmentLoanBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const result = await this.createEquipmentLoanUseCase.execute(request.body);

      return reply.status(201).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  async returnLoan(
    request: FastifyRequest<{ 
      Params: ReturnEquipmentLoanParams; 
      Body: ReturnEquipmentLoanBody 
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const result = await this.returnEquipmentLoanUseCase.execute(
        request.params.id,
        request.body
      );
      
      return reply.status(200).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    if (error instanceof CategoryRestrictionError) return reply.status(403).send({ error: 'Forbidden', message: error.message, code: 'CATEGORY_RESTRICTION' });
    if (error instanceof MemberNotFoundError) return reply.status(404).send({ error: 'Not Found', message: error.message, code: 'MEMBER_NOT_FOUND' });
    if (error instanceof InvalidStateTransitionError) return reply.status(409).send({ error: 'Conflict', message: error.message, code: 'ALREADY_RETURNED' });
    if (
      error instanceof InvalidItemNameError || error instanceof InvalidMemberIdError ||
      error instanceof MissingNotesError || error instanceof InvalidStatusError
    ) {
      return reply.status(400).send({ error: 'Bad Request', message: error.message, code: 'VALIDATION_ERROR' });
    }
    console.error('Unexpected error:', error);
    return reply.status(500).send({ error: 'Internal Server Error', message: 'Ocurrió un error al procesar la solicitud', code: 'INTERNAL_ERROR' });
  }
}
