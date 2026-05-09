| identificación | 06 |
|---------------|---|
| **Estado**    | Propuesto |
| **Autor**     | Lautaro Flores |
| **Fecha**     | 2026-05-03 |
| **Título**    | Eliminación de Certificado Médico |

# TDD-0006: Eliminación de Certificado Médico (Baja Lógica)

## 1. Contexto de Negocio

### 1.1. Objetivo
Permitir al administrador del Club Alentapp dar de baja lógica un certificado médico previamente registrado en el sistema. La baja se utiliza principalmente para descartar certificados cargados por error, sin eliminar físicamente el registro de la base de datos. El registro queda marcado con la fecha de baja y deja de ser considerado por el resto del sistema, pero permanece almacenado para fines de auditoría e historial.

### 1.2. User Persona
*   **Administrativo del Club**: Dar de baja certificados médicos cargados por error para que dejen de aparecer como vigentes en el sistema, sin perder la trazabilidad histórica de los registros.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 3: Eliminar Certificado (Baja Lógica)
*   **Como** administrativo del club, **quiero** dar de baja un certificado médico previamente registrado, **para** que el registro deje de considerarse vigente en el sistema mientras se conserva en la base de datos para auditoría.
*   **Escenario de éxito**: Si el administrador solicita la eliminación de un certificado existente y activo, el sistema marca el campo `deletedAt` con la fecha actual y devuelve una respuesta de éxito. El registro deja de aparecer en cualquier consulta del sistema.
*   **Escenario de fallo**: Si el administrador intenta eliminar un certificado que no existe o que ya fue dado de baja previamente, el sistema responde con un error indicando que el recurso no se encuentra disponible.

### 1.4. Criterios Generales de Aceptación

*   El sistema debe validar que el parámetro `id` recibido sea un UUID válido.
*   El sistema debe validar que el certificado identificado por `id` exista en la base de datos.
*   El sistema debe tratar los certificados ya eliminados (`deletedAt IS NOT NULL`) como inexistentes, devolviendo el mismo error que si nunca hubieran existido.
*   El sistema debe marcar el campo `deletedAt` con la fecha y hora actuales en el momento de la baja, sin modificar ningún otro campo del certificado.
*   El sistema debe garantizar que el registro físico permanezca en la base de datos tras la baja, preservando todos sus datos originales.
*   El sistema no debe afectar a otros certificados del mismo socio durante la operación.


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

La baja solo modifica el campo `deletedAt`, asignándole la fecha y hora actuales. La operación solo aplica sobre certificados activos (`deletedAt = null`).

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Eliminar Certificado Médico
**Método:** `DELETE /api/v1/medical-certificates/:id`

- **Response:** `204 No Content`

Se utiliza el código `204 No Content` como respuesta a la baja exitosa. La operación se completó correctamente y no hay contenido relevante para devolver al cliente.

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto
*   **`findById(id: string): Promise<MedicalCertificate | null>`**
    Busca un certificado por su identificador. Devuelve `null` si no existe o si fue eliminado lógicamente (`deletedAt IS NOT NULL`).

*   **`softDelete(id: string): Promise<void>`**
    Marca el campo `deletedAt` del certificado identificado por `id` con la fecha y hora actuales. No modifica ningún otro campo del registro.

### 3.2. Lógica del Caso de Uso
**Caso de Uso:** `Eliminar Certificado` (DeleteMedicalCertificate)

**Flujo paso a paso:**

1.  **Validación de formato de entrada.** Validar con `zod` que el parámetro `id` sea un UUID válido.

2.  **Búsqueda del certificado.** Invocar `MedicalCertificateRepository.findById(id)`. Si el método devuelve `null`, significa que el certificado no existe o ya fue eliminado lógicamente, y se interrumpe el flujo.

3.  **Ejecución de la baja lógica.** Invocar `MedicalCertificateRepository.softDelete(id)`. El repositorio actualiza únicamente el campo `deletedAt` del registro, asignándole la fecha y hora actuales.

4.  **Respuesta exitosa.** Devolver una respuesta `204 No Content` sin contenido en el body.


## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Formato de id inválido** | El parámetro `id` no es un UUID válido. | `400 Bad Request` |
| **Certificado inexistente** | El `id` no corresponde a ningún certificado, o el certificado ya fue eliminado lógicamente (`deletedAt IS NOT NULL`). | `404 Not Found` |
| **Error de Infraestructura** | Falla la conexión con la base de datos. | `500 Internal Server Error` |


## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se utilizará la librería `zod` para validar que el parámetro `id` recibido sea un UUID válido antes de invocar el caso de uso.

### 5.2. Conservación del registro físico
La baja es estrictamente lógica: el registro permanece en la base de datos con todos sus campos originales intactos, salvo `deletedAt`, que pasa de `null` a la fecha y hora de la baja. Esto permite mantener la trazabilidad histórica completa y, si fuera necesario, recuperar el registro en el futuro.

### 5.3. Independencia respecto al estado de validación
La baja no modifica el campo `isValidated`. Si el certificado estaba validado en el momento de la baja, conserva ese valor. El sistema deja de considerarlo como vigente porque las consultas que buscan certificados activos filtran por `deletedAt IS NULL`, no por `isValidated`. Esto preserva la información histórica del estado del documento al momento de eliminarlo.

### 5.4. Repetición de la misma operación
Si el administrador intenta eliminar un certificado ya eliminado, el sistema responde con `404 Not Found`, igual que si el certificado nunca hubiera existido. Esta indistinción evita exponer información sobre el estado interno del sistema.


## 6. Componentes de Arquitectura Hexagonal
*   **Domain**: entidad `MedicalCertificate`, regla de baja lógica (modificación de `deletedAt`), puerto `MedicalCertificateRepository`.
*   **Application**: caso de uso `DeleteMedicalCertificate`.
*   **Infrastructure**: `MedicalCertificateController` (endpoint `DELETE /api/v1/medical-certificates/:id`), `PrismaMedicalCertificateRepository` (implementación de `findById` y `softDelete`), schemas de validación con `zod`.


## 7. Plan de Implementación
1.  Agregar la firma del método `softDelete` (y `findById` si no existe) al puerto `MedicalCertificateRepository` en la capa de Domain.
2.  Implementar `softDelete` y `findById` en `PrismaMedicalCertificateRepository` en Infrastructure.
3.  Implementar el caso de uso `DeleteMedicalCertificate` en Application, inyectando el repositorio de certificados.
4.  Definir el schema de validación con `zod` para el parámetro `id` de la URL.
5.  Registrar el endpoint `DELETE /api/v1/medical-certificates/:id` en el controlador de Fastify.
6.  Escribir tests unitarios del caso de uso (con mock del repositorio) y tests de integración del repositorio.