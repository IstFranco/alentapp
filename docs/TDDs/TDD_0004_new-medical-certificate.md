| identificación | 04 |
|---------------|---|
| Estado        | Propuesto |
| autor         | Lautaro Flores |
| fecha         | 2026-05-03 |
| título        | Registro de Certificado Médico |

# TDD-[0004]: Registro de Nuevo Certificado Médico

## 1. Contexto de Negocio

### 1.1. Objetivo
Permitir a los administradores registrar nuevos certificados médicos en el sistema del Club Alentapp, definiendo los atributos principales como fecha de emisión, fecha de vencimiento y matrícula médica para habilitar al socio en la práctica deportiva.

### 1.2. User Persona
*   **Administrativo**: Registrar de forma ágil y correcta los certificados médicos físicos que presentan los socios para asegurar que el club cuente con el respaldo sanitario necesario y que el socio quede habilitado para sus actividades sin demoras administrativas.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Crear Certificado Médico
*   **Como** administrativo, **quiero** crear un nuevo certificado médico con sus fechas y matrícula, **para** que el socio cuente con el respaldo legal y sanitario para realizar deportes.
*   **Escenario de éxito**: Si el administrativo completa de manera correcta los campos requeridos y la fecha de vencimiento es posterior a la de emisión, el sistema deberá crear el nuevo registro, notificar el éxito y marcar automáticamente como inactivos los certificados previos del socio.
*   **Escenario de fallo**: Si el administrativo ingresa una fecha de vencimiento menor o igual a la de emisión, el sistema deberá responder con una advertencia de rango de fechas inválido y no permitir el alta del registro.


## 2. Diseño Técnico

### 2.1. Modelo de Dominio
Se definirá la entidad **MedicalCertificate** con las siguientes propiedades y restricciones:

*   **id**: identificador único universal (UUID) generado por el sistema.
*   **issue_date**: fecha de emisión del certificado.
*   **expiry_date**: fecha de vencimiento. Debe ser posterior a la fecha de emisión.
*   **doctor_license**: cadena de texto que representa la matrícula del profesional.
*   **is_validated**: booleano. Indica si el administrativo aprobó el documento. Por defecto es `false`.
*   **member_id**: UUID del socio asociado al certificado.

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Crear Certificado Médico
**Método:** `POST /api/v1/medical-certificates`

**Request Body** (`CreateMedicalCertificateDto`):
```typescript
{
    member_id: string;      // ID del socio
    issue_date: string;     
    expiry_date: string;    
    doctor_license: string; // Matrícula médica
}
```

- **Response:** `201 Created`
- **Response Body**:
```ts
{
    id: string;
    member_id: string;
    issue_date: string;
    expiry_date: string;
    doctor_license: string;
    is_validated: boolean;  // Se inicializa en false
}
```

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

```typescript
export interface MedicalCertificateRepository {
  create(certificate: MedicalCertificate): Promise<MedicalCertificate>;
  findByMemberId(memberId: string): Promise<MedicalCertificate[]>;
  update(id: string, data: Partial<MedicalCertificate>): Promise<MedicalCertificate>;
}
```

### 3.2. Lógica del Caso de Uso
**Caso de Uso:** `Registrar Nuevo Certificado` (CreateMedicalCertificate)

**Flujo paso a paso:**

1. Validar que los datos de entrada sean del tipo esperado y que los campos obligatorios estén presentes. Validar que la fecha de emisión (`issue_date`) no sea posterior a la fecha de vencimiento (`expiry_date`).

2. Verificar la existencia del socio (`member_id`) en el sistema. Consultar si el socio ya posee certificados médicos registrados en la base de datos.

3. Aplicar la regla de negocio: si existen registros anteriores, se deben invalidar o marcar como históricos para que solo el nuevo sea el vigente. Mapear los datos del DTO recibido a una entidad del dominio `MedicalCertificate`.

4. Persistir la nueva entidad a través de `MedicalCertificateRepository.create()`.

5. Retornar el DTO de respuesta mapeado desde la entidad persistida con el código `201 Created`.


## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Datos Faltantes** | Los campos obligatorios (member_id, issue_date, doctor_license) deben estar presentes. | 400 |
| **Rango de Fechas Inválido** | La fecha de vencimiento (`expiry_date`) debe ser posterior a la de emisión. | 400 |
| **Socio Inexistente** | El `member_id` proporcionado no existe en la base de datos. | 404 |
| **Certificado Expirado** | No se permite dar de alta un certificado cuya fecha de vencimiento ya pasó. | 409 |
| **Error de Infraestructura** | Falla la conexión con el contenedor de la base de datos. | 500 |


## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se utilizarán librerías como `zod` para validar que los strings de las fechas sigan el formato ISO y que la matrícula médica no sea una cadena vacía.

### 5.2. Consideraciones de negocio
- Al momento de la creación exitosa, el sistema debe garantizar de forma atómica que cualquier otro certificado del socio pase a un estado histórico.
- El campo `is_validated` siempre debe inicializarse en `false`, requiriendo una acción posterior del administrativo para su aprobación definitiva.

### 5.3. Consideraciones de seguridad
- El endpoint de creación debe estar protegido y ser accesible únicamente por usuarios con el rol de administrativo.
