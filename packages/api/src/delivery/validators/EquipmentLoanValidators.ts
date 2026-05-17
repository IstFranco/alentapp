import { z } from 'zod';

export const createEquipmentLoanSchema = z.object({
  body: z.object({
    itemName: z
      .string({
        required_error: 'El nombre del ítem es requerido'
      })
      .min(3, 'El nombre del ítem debe tener al menos 3 caracteres')
      .max(255, 'El nombre del ítem no puede exceder 255 caracteres')
      .trim(),
    
    memberDni: z
      .string({ required_error: 'El DNI del socio es requerido' })
      .min(6, 'El DNI debe tener al menos 6 caracteres')
      .max(10, 'El DNI no puede exceder 10 caracteres')
      .regex(/^[0-9]+$/, 'El DNI solo debe contener números')
      .trim(),
    
    notes: z
      .string()
      .max(1000, 'Las notas no pueden exceder 1000 caracteres')
      .trim()
      .optional()
  })
});

export type CreateEquipmentLoanBody = z.infer<typeof createEquipmentLoanSchema>['body'];

export const returnEquipmentLoanSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'El ID del préstamo es requerido'
      })
      .uuid('El ID del préstamo debe ser un UUID válido')
  }),
  body: z.object({
    status: z
      .enum(['Returned', 'Damaged'])
      .optional()
      .default('Returned'),
    notes: z
      .string()
      .max(1000, 'Las notas no pueden exceder 1000 caracteres')
      .trim()
      .optional()
  }).refine(
    (data) => {
      if (data.status === 'Damaged') {
        // Validamos que si está roto tenga una nota explicativa de mínimo 10 caracteres
        return data.notes !== undefined && data.notes.trim().length >= 10;
      }
      return true;
    },
    {
      message: 'Si el material está dañado, debe proporcionar notas explicativas (mínimo 10 caracteres)',
      path: ['notes']
    }
  )
});

export type ReturnEquipmentLoanParams = z.infer<typeof returnEquipmentLoanSchema>['params'];
export type ReturnEquipmentLoanBody = z.infer<typeof returnEquipmentLoanSchema>['body'];

export const cancelEquipmentLoanSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'El ID del préstamo es requerido'
      })
      .uuid('El ID del préstamo debe ser un UUID válido')
  }),
  body: z.object({
    reason: z
      .string()
      .max(500, 'El motivo no puede exceder 500 caracteres')
      .trim()
      .optional()
  })
});

export type CancelEquipmentLoanParams = z.infer<typeof cancelEquipmentLoanSchema>['params'];
export type CancelEquipmentLoanBody = z.infer<typeof cancelEquipmentLoanSchema>['body'];