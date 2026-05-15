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
    
    memberId: z
      .string({
        required_error: 'El ID del socio es requerido'
      })
      .uuid('El ID del socio debe ser un UUID válido'),
    
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
    status: z.enum(['Returned', 'Damaged'], {
      required_error: 'El estado es requerido',
      invalid_type_error: 'El estado debe ser "Returned" o "Damaged"'
    }),
    notes: z
      .string()
      .min(10, 'Las notas deben tener al menos 10 caracteres')
      .max(1000, 'Las notas no pueden exceder 1000 caracteres')
      .trim()
      .optional()
  }).refine(
    (data) => {
      if (data.status === 'Damaged') {
        return data.notes !== undefined && data.notes.length >= 10;
      }
      return true;
    },
    {
      message: 'Si el material está dañado, debe proporcionar notas explicativas',
      path: ['notes']
    }
  )
});

export type ReturnEquipmentLoanParams = z.infer<typeof returnEquipmentLoanSchema>['params'];
export type ReturnEquipmentLoanBody = z.infer<typeof returnEquipmentLoanSchema>['body'];