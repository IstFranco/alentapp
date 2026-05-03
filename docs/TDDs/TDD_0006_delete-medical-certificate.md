| identificación | 06 |
|---------------|---|
| **Estado**    | Propuesto |
| **autor**     | Lautaro Flores |
| **fecha**     | 2026-05-03 |
| **título**    | Eliminación de Certificado Médico |

# TDD-0006: Eliminación de Certificado Médico (Baja Lógica)

## 1. Contexto de Negocio

### 1.1. Objetivo
Permitir a los administradores dar de baja un certificado médico existente en el sistema del Club Alentapp de forma lógica, invalidando su vigencia sin eliminar el registro físico, para mantener el historial de salud del socio.

### 1.2. User Persona
*   **Administrativo**: Inhabilitar un certificado médico que fue cargado por error o que debe ser revocado por causas médicas, asegurando que el sistema refleje que el socio ya no cuenta con un apto físico vigente para realizar deportes.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 3: Eliminar Certificado (Baja Lógica)
*   **Como** administrativo, **quiero** eliminar (invalidar) un certificado médico, **para** mantener actualizada la lista de aptos físicos vigentes del club.
*   **Escenario de éxito**: Al solicitar la eliminación, el sistema debe pedir confirmación y, tras la aceptación, cambiar el estado del certificado a "Invalido", notificando el éxito de la operación.
*   **Escenario de fallo**: Si el usuario no tiene permisos administrativos, el sistema debe denegar la acción y mostrar un mensaje de error de falta de autorización.

## 2. Diseño Técnico

### 2.1. Modelo de Dominio
Se utiliza la entidad **MedicalCertificate**. Para la baja lógica, se operará principalmente sobre el campo `is_validated` (seteándolo en `false`).

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Eliminar Certificado Médico
**Método:** `DELETE /api/v1/medical-certificates/:id`

- **Response:** `200 Ok`
- **Response Body**:
```typescript
{
  "message": "Certificado médico invalidado exitosamente"
}
```


## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto
```typescript
export interface MedicalCertificateRepository {
  deleteById(id: string): Promise<void>; // La implementación realizará el borrado lógico
}
```

### 3.2. Lógica del Caso de Uso
**Caso de Uso:** `Eliminar Certificado` (DeleteMedicalCertificate)

**Flujo paso a paso:**

1. Validar la existencia del certificado médico a través de su `id` en la base de datos.

2. Verificar que el certificado se encuentre actualmente con `is_validated` en `true`. Si ya está en `false`, notificar que el recurso ya fue invalidado previamente.

3. Ejecutar la baja lógica a través del método `MedicalCertificateRepository.deleteById()`, el cual realizará un `update` interno del campo `is_validated` a `false`.

4. Retornar un mensaje de éxito confirmando la operación con el código `200 OK`.

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Recurso Inexistente** | El `id` del certificado no existe en la base de datos. | 404 | 
| **Sin Permisos** | El usuario intenta realizar la baja sin tener el rol de administrativo. | 403 |
| **Ya Invalidado** | El certificado ya se encuentra en estado `false`. | 409 |
| **Error de Infraestructura** | Falla la comunicación con el servidor de base de datos. | 500 |

## 5. Observaciones Adicionales

### 5.1. Consideraciones de negocio
- Al tratarse de una **baja lógica**, el registro permanece en la base de datos, pero el sistema debe considerarlo como no apto para inscripciones deportivas.

### 5.2. Consideraciones de seguridad
- Esta acción debe quedar registrada indicando qué usuario administrativo realizó la baja lógica para mantener la trazabilidad.

