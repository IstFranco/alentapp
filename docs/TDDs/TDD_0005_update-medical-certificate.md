| identificación | 05 |
|---------------|---|
| **Estado**    | Propuesto |
| **autor**     | Lautaro Flores |
| **fecha**     | 2026-05-03 |
| **título**    | Modificación de un Certificado Médico |

# TDD-0005: Modificación de un Certificado Médico

## 1. Contexto de Negocio

### 1.1. Objetivo
Permitir a los administradores modificar la información de un certificado médico existente en el sistema del Club Alentapp, principalmente para validar el documento tras la revisión física o extender su fecha de vencimiento.

### 1.2. User Personas
*   **Administrativo**: Validar los certificados médicos cargados o actualizar las fechas de vencimiento de forma ágil para asegurar que la habilitación de los socios sea correcta en el sistema, evitando bloqueos innecesarios en el acceso a deportes por demoras en la carga de datos.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 2: Editar/Validar Certificado
*   **Como** administrativo, **quiero** modificar el estado de validación o la fecha de vencimiento de un certificado, **para** confirmar que el socio cumple con los requisitos sanitarios.
*   **Escenario de éxito**: Si el administrativo cambia el estado a "Validado" o ingresa una nueva fecha de vencimiento válida, el sistema deberá actualizar los campos y notificar la operación exitosa.
*   **Escenario de fallo**: Si el administrativo intenta modificar la matrícula (`doctor_license`) o el socio asignado (`member_id`) de un certificado ya creado, el sistema deberá ignorar esos cambios y notificar que no es posible realizar dicha actualización.

## 2. Diseño Técnico

### 2.1. Modelo de Dominio
Se utiliza la entidad **MedicalCertificate** definida anteriormente. Los campos editables en este proceso son únicamente `is_validated` y `expiry_date`.

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Actualizar Certificado Médico
**Método:** `PATCH /api/v1/medical-certificates/:id`

**Request Body** (`UpdateMedicalCertificateDto`):
```typescript
{
  expiry_date?: string;   // Editable, debe ser posterior a la emisión
  is_validated?: boolean; // Editable por administrativos
}
```
- **Response:** `200 Ok`
- **Response Body**:
```ts
{
    id: string;
    member_id: string;
    issue_date: string;
    expiry_date: string;
    doctor_license: string;
    is_validated: boolean;
}
```

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

```typescript
export interface MedicalCertificateRepository {
  update(id: string, data: Partial<Omit<MedicalCertificate, 'id' | 'member_id' 'doctor_license'>>): Promise<MedicalCertificate>;
}
```

### 3.2. Lógica del Caso de Uso
**Caso de Uso:** `Actualizar Certificado`(UpdateMedicalCertificate)

**Flujo paso a paso:**

1. Validar la existencia del certificado médico a través de su `id` en la base de datos. Validar que la petición solo contenga datos editables (`expiry_date`, `is_validated`) o ignorar el resto de la información recibida para mantener la integridad de los campos inmutables.

2. Si la actualización incluye la fecha de vencimiento (`expiry_date`), validar que esta sea estrictamente posterior a la fecha de emisión original del certificado. Si se incluye el cambio de estado en `is_validated`, verificar que el usuario que realiza la acción cuente con los permisos administrativos requeridos.

3. Mapear los datos del DTO recibido en la entidad de dominio asociada al certificado que se desea modificar.

4. Persistir los cambios en la base de datos a través del método `MedicalCertificateRepository.update()`.

5. Retornar el `MedicalCertificateDTO` mapeado desde la entidad actualizada para confirmar que la operación fue exitosa.


## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Recurso Inexistente** | El `id` del certificado médico no existe en la base de datos. | 404 | 
| **Modificación Inválida** | No se permite modificar los campos `member_id`, `issue_date` o `doctor_license` una vez creado el registro. | 400 |
| **Fecha Inválida** | La nueva `expiry_date` no puede ser menor o igual a la fecha de emisión original. | 400 | 
| **Sin Permisos** | El usuario no tiene rol administrativo para modificar el campo `is_validated`. | 403 |
| **Error de Infraestructura** | Falla la conexión con la base de datos. | 500 |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se utilizarán librerías como `zod` para validar que los datos de entrada en el DTO cumplan con los formatos esperados, asegurando que `expiry_date` sea un string con formato ISO válido y `is_validated` sea un booleano.

### 5.2. Consideraciones de negocio
- El campo `member_id` y `doctor_license` deben permanecer inmutables tras la creación para mantener la trazabilidad del certificado original.
- Al actualizar la fecha de vencimiento, el sistema no debe alterar automáticamente el estado de validación a menos que se especifique explícitamente en el request.

### 5.3. Consideraciones de seguridad
- Los endpoints de modificación deben estar restringidos exclusivamente a usuarios con rol administrativo autenticados en el sistema.