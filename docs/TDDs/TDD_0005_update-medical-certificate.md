| identificación | 05 |
|---------------|---|
| **Estado**    | Propuesto |
| **Autor**     | Lautaro Flores |
| **Fecha**     | 2026-05-03 |
| **Título**    | Modificación de un Certificado Médico |

# TDD-0005: Modificación de un Certificado Médico

## 1. Contexto de Negocio

### 1.1. Objetivo
Permitir al administrador del Club Alentapp modificar el estado de validación administrativa de un certificado médico previamente registrado. La modificación se utiliza para confirmar que el documento físico fue revisado y es correcto, cambiando su campo `isValidated` de `false` a `true`. Los demás campos del certificado son inmutables y no se pueden modificar a través de esta operación.


### 1.2. User Personas
*   **Administrativo del club**: Validar de forma rápida los certificados médicos previamente cargados en el sistema, dejando constancia de que el documento físico fue revisado y aprobado, para que los socios queden efectivamente habilitados a la práctica deportiva.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 2: Editar/Validar Certificado
*   **Como** administrativo del club, **quiero** modificar el estado de validación de un certificado médico previamente cargado, **para** confirmar que el documento fue revisado y aprobado, dejando al socio habilitado para la actividad deportiva.
*   **Escenario de éxito**: Si el administrador envía la modificación de `isValidated` para un certificado existente y activo, el sistema actualiza el campo, persiste el cambio y devuelve el certificado completo en su nuevo estado.
*   **Escenario de fallo**: Si el administrador intenta modificar campos no permitidos como `memberId`, `issueDate`, `expiryDate` o `doctorLicense`, el sistema rechaza la operación con un mensaje indicando que esos campos no son modificables y no aplica ningún cambio en la base de datos.

### 1.4. Criterios Generales de Aceptación
*   El sistema debe validar que el certificado identificado por el parámetro `id` exista en la base de datos.
*   El sistema debe validar que el certificado no haya sido eliminado lógicamente (`deletedAt = null`).
*   El sistema debe permitir modificar únicamente el campo `isValidated`. Cualquier intento de modificar otros campos debe ser rechazado.
*   El sistema debe rechazar requests con un cuerpo vacío o sin el campo `isValidated`.
*   El sistema debe persistir la modificación de forma directa, sin afectar a otros certificados del mismo socio.
*   El sistema debe devolver el certificado completo y actualizado como respuesta a la operación exitosa.


## 2. Diseño Técnico

### 2.1. Modelo de Dominio
Se utiliza la entidad **MedicalCertificate**.

*   **id**: `string`. Identificador único universal (UUID) generado por el sistema.
*   **memberId**: `string`. UUID del socio asociado al certificado.
*   **issueDate**: `Date`. Fecha de emisión del certificado.
*   **expiryDate**: `Date`. Fecha de vencimiento.
*   **doctorLicense**: `string`. Matrícula del profesional firmante.
*   **isValidated**: `boolean`. Indica si el certificado fue validado administrativamente.
*   **deletedAt**: `Date | null`. Marca de baja lógica. `null` indica que el registro está activo.

El único campo modificable a través de este caso de uso es `isValidated`.

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Actualizar Certificado Médico
**Método:** `PATCH /api/v1/medical-certificates/:id`

**Request Body** (`UpdateMedicalCertificateDto`):
```typescript
{
  isValidated: boolean; // Unico campo modificable
}
```
- **Response:** `200 Ok`
- **Response Body**:
```ts
{
    id: string;
    memberId: string;
    issueDate: string;
    expiryDate: string;
    doctorLicense: string;
    isValidated: boolean;
}
```

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

*   **`findById(id: string): Promise<MedicalCertificate | null>`**
    Busca un certificado por su identificador. Devuelve `null` si no existe o si fue eliminado lógicamente (`deletedAt IS NOT NULL`).

*   **`updateValidationStatus(id: string, isValidated: boolean): Promise<MedicalCertificate>`**
    Modifica el campo `isValidated` del certificado identificado por `id`. No afecta a ningún otro campo ni a otros certificados. Devuelve el certificado actualizado.

### 3.2. Lógica del Caso de Uso
**Caso de Uso:** `Actualizar Certificado`(UpdateMedicalCertificate)

**Flujo paso a paso:**

1.  **Validación de formato de entrada.** Validar con `zod` que el parámetro `id` sea un UUID válido y que el body contenga el campo `isValidated` como booleano. Rechazar cualquier campo adicional no permitido.

2.  **Búsqueda del certificado.** Invocar `MedicalCertificateRepository.findById(id)`. Si el método devuelve `null`, significa que el certificado no existe o fue eliminado lógicamente, y se interrumpe el flujo.

3.  **Persistencia de la modificación.** Invocar `MedicalCertificateRepository.updateValidationStatus(id, isValidated)`. El repositorio actualiza únicamente el campo `isValidated` del registro.

4.  **Mapeo de entidad a DTO de respuesta.** Convertir la entidad actualizada a `MedicalCertificateDto`, transformando las fechas `Date` a strings ISO 8601 y omitiendo el campo `deletedAt`.

5.  **Respuesta exitosa.** Devolver el DTO con código `200 OK`.


## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Datos faltantes o formato inválido** | El parámetro `id` no es un UUID válido, o el body no contiene el campo `isValidated` como booleano. | `400 Bad Request` |
| **Campos no permitidos** | El body contiene campos distintos a `isValidated` (por ejemplo `expiryDate`, `doctorLicense`, `memberId`). | `400 Bad Request` |
| **Certificado inexistente** | El `id` no corresponde a ningún certificado, o el certificado fue eliminado lógicamente (`deletedAt IS NOT NULL`). | `404 Not Found` |
| **Error de Infraestructura** | Falla la conexión con la base de datos. | `500 Internal Server Error` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se utilizarán librerías como `zod` para validar que los datos de entrada cumplan con los formatos esperados, asegurando `isValidated` sea un booleano, que el `id` sea un UUID válido y que el body no contenga campos adicionales no permitidos.

### 5.2. Repetición de la misma operación
Si el certificado ya está en el estado solicitado (validar un certificado que ya tenía `isValidated = true`), el sistema acepta la operación y responde con éxito, sin generar cambios reales en la base. 

### 5.3. Inmutabilidad de los demás campos
Los campos `memberId`, `issueDate`, `expiryDate` y `doctorLicense` son inmutables a través de esta operación. Si se necesita corregir alguno de estos datos por un error de carga, el flujo correcto es eliminar lógicamente el certificado erróneo (TDD de Baja) y crear uno nuevo con los datos correctos (TDD de Alta).


## 6. Componentes de Arquitectura Hexagonal

*   **Domain**: entidad `MedicalCertificate`, regla de inmutabilidad de campos distintos a `isValidated`, puerto `MedicalCertificateRepository`.
*   **Application**: caso de uso `UpdateMedicalCertificate`, mapeo de entidad a DTO de respuesta.
*   **Infrastructure**: `MedicalCertificateController` (endpoint `PATCH /api/v1/medical-certificates/:id`), `PrismaMedicalCertificateRepository` (implementación de `findById` y `updateValidationStatus`), schemas de validación con `zod`.


## 7. Plan de Implementación

1.  Definir `UpdateMedicalCertificateDto` en `@alentapp/shared`.
2.  Agregar la firma del método `updateValidationStatus` (y `findById` si no existe) al puerto `MedicalCertificateRepository` en la capa de Domain.
3.  Implementar `updateValidationStatus` y `findById` en `PrismaMedicalCertificateRepository` en Infrastructure.
4.  Implementar el caso de uso `UpdateMedicalCertificate` en Application, inyectando el repositorio de certificados.
5.  Definir los schemas de validación con `zod` para `UpdateMedicalCertificateDto`, incluyendo el rechazo de campos no permitidos.
6.  Registrar el endpoint `PATCH /api/v1/medical-certificates/:id` en el controlador de Fastify.
7.  Escribir tests unitarios del caso de uso (con mock del repositorio) y tests de integración del repositorio.