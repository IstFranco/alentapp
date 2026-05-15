import { FastifyInstance } from 'fastify';
import { EquipmentLoanController } from '../controllers/EquipmentLoanController';
import { createEquipmentLoanSchema } from '../validators/EquipmentLoanValidators';
import { validateSchema } from '../middlewares/validateSchema';
import { requireAuth } from '../middlewares/requireAuth';
import { requireRole } from '../middlewares/requireRole';

export async function equipmentLoanRoutes(
  fastify: FastifyInstance,
  controller: EquipmentLoanController
) {
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
}
