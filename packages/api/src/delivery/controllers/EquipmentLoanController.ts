import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateEquipmentLoanUseCase } from '../../application/use-cases/CreateEquipmentLoanUseCase.js';
import { ReturnEquipmentLoanUseCase } from '../../application/use-cases/ReturnEquipmentLoanUseCase.js';
import { CancelEquipmentLoanUseCase } from '../../application/use-cases/CancelEquipmentLoanUseCase.js';
import { 
  CreateEquipmentLoanBody, 
  ReturnEquipmentLoanParams, 
  ReturnEquipmentLoanBody,
  CancelEquipmentLoanParams,
  CancelEquipmentLoanBody
} from '../validators/EquipmentLoanValidators.js';
import {
  MemberNotFoundError,
  CategoryRestrictionError,
  InvalidItemNameError,
  InvalidMemberIdError,
  LoanNotFoundError,
  InvalidStateTransitionError,
  MissingNotesError,
  InvalidStatusError,
  CannotCancelProcessedLoanError,
  AlreadyCanceledError
} from '../../domain/errors/EquipmentLoanErrors.js';

export class EquipmentLoanController {
  constructor(
    private readonly createEquipmentLoanUseCase: CreateEquipmentLoanUseCase,
    private readonly returnEquipmentLoanUseCase: ReturnEquipmentLoanUseCase,
    private readonly cancelEquipmentLoanUseCase: CancelEquipmentLoanUseCase
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

    async cancelLoan(
    request: FastifyRequest<{
      Params: CancelEquipmentLoanParams;
      Body: CancelEquipmentLoanBody
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const result = await this.cancelEquipmentLoanUseCase.execute(
        request.params.id,
        request.body
      );
      
      return reply.status(200).send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  }

  private handleError(error: unknown, reply: FastifyReply): void {
    // Errores 403 Forbidden
    if (error instanceof CategoryRestrictionError) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: error.message,
        code: 'CATEGORY_RESTRICTION'
      });
    }

    // Errores 404 Not Found
    if (error instanceof MemberNotFoundError || error instanceof LoanNotFoundError) {
      return reply.status(404).send({
        error: 'Not Found',
        message: error.message,
        code: error instanceof MemberNotFoundError ? 'MEMBER_NOT_FOUND' : 'LOAN_NOT_FOUND'
      });
    }

    // Errores 409 Conflict
    if (
      error instanceof InvalidStateTransitionError ||
      error instanceof CannotCancelProcessedLoanError ||
      error instanceof AlreadyCanceledError
    ) {
      let code = 'ALREADY_RETURNED';
      
      if (error instanceof AlreadyCanceledError) {
        code = 'ALREADY_CANCELED';
      } else if (error instanceof CannotCancelProcessedLoanError) {
        code = 'CANNOT_CANCEL_RETURNED_LOAN';
      }
      
      return reply.status(409).send({
        error: 'Conflict',
        message: error.message,
        code
      });
    }

    // Errores 400 Bad Request
    if (
      error instanceof InvalidItemNameError ||
      error instanceof InvalidMemberIdError ||
      error instanceof MissingNotesError ||
      error instanceof InvalidStatusError
    ) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error.message,
        code: 'VALIDATION_ERROR'
      });
    }

    // Error genérico
    console.error('Unexpected error:', error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Ocurrió un error al procesar la solicitud',
      code: 'INTERNAL_ERROR'
    });
  }
}
