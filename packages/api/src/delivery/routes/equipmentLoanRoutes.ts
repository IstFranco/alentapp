import { FastifyInstance } from 'fastify';
import { EquipmentLoanController } from '../controllers/EquipmentLoanController.js';
import { 
  createEquipmentLoanSchema, 
  returnEquipmentLoanSchema,
  cancelEquipmentLoanSchema
} from '../validators/EquipmentLoanValidators.js';
import { validateSchema } from '../middlewares/validateSchema.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';

export async function equipmentLoanRoutes(
  fastify: FastifyInstance,
  controller: EquipmentLoanController
) {
  // GET /api/v1/equipment-loans - Listar préstamos
  fastify.get(
    '/equipment-loans',
    {
      preHandler: [
        //requireAuth,
        //requireRole(['admin'])
      ]
    },
    (request, reply) => controller.list(request, reply)
  );

  // POST /api/v1/equipment-loans
  fastify.post(
    '/equipment-loans',
    {
      preHandler: [
        //requireAuth,
        //requireRole(['admin']),
        
        // DESCOMENTAR ESTAS LINEAS ASI SOLO EL ADMIN PUEDE DAR DE ALTA EQUIPMENT LOANS.

        validateSchema(createEquipmentLoanSchema)
      ]
    },
    (request, reply) => controller.create(request, reply)
  );

  fastify.patch(
    '/equipment-loans/:id/return',
    {
      preHandler: [
        //requireAuth,
        //requireRole(['admin']),

        // LO MISMO QUE ARRIBA. -------------------------

        validateSchema(returnEquipmentLoanSchema)
      ]
    },
    (request, reply) => controller.returnLoan(request, reply)
  );

  fastify.patch(
    '/equipment-loans/:id/cancel',
    {
      preHandler: [
        //requireAuth,
        //requireRole(['admin']),
        validateSchema(cancelEquipmentLoanSchema)
      ]
    },
    (request, reply) => controller.cancelLoan(request, reply)
  );
}
