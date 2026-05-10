# TDD-0016: Cancelación de Préstamo de Equipamiento (Delete EquipmentLoan)

| identificación | 0016 |
|---------------|---|
| estado        | Propuesto |
| autor         | Franco Oyhenart |
| fecha         | 2026-05-03 |
| título        | Eliminacion logica de un prestamo de equipamiento |

---

## 1. Contexto de Negocio (El "Qué")

### 1.1. Objetivo

Permitir la cancelación de préstamos registrados erróneamente o que necesitan ser anulados, sin eliminar físicamente el registro de la base de datos para mantener la trazabilidad y auditoría.

### 1.2. User Personas

- **Administrativo del Club**: Necesita poder cancelar préstamos que fueron registrados por error o que el socio decidió no retirar.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Cancelación Exitosa
- **Como** administrativo, **quiero** cancelar un préstamo que fue registrado por error, **para** mantener limpio el registro de préstamos activos sin perder la trazabilidad.
- **Escenario de éxito**: Al cancelar un préstamo con estado "Loaned", el sistema cambia el estado a "Canceled", registra la fecha de cancelación y retorna código 200 OK.
- **Escenario de fallo**: El sistema no puede conectarse a la base de datos; retorna error 500 Internal Server Error.
- **Escenario de fallo**: Al cancelar un prestamo con estado "Returned" o "Canceled" el sistema retorna un error 409 Conflict.

### 1.4. Criterios Generales

1. Un préstamo con estado `Returned` o `Damaged` no puede ser anulado bajo ninguna circunstancia.
2. La eliminación es **lógica**: el registro nunca se borra físicamente de la tabla `EquipmentLoan`.
3. El campo `isActive` debe pasar a `false` y `status` a `Canceled` en la misma transacción.
4. Solo usuarios con rol administrativo pueden ejecutar la baja lógica.
5. Al anular un préstamo, el material asociado queda inmediatamente disponible para un nuevo registro.

---

## 2. Diseño Técnico (El "Cómo")

### 2.1. Modelo de Dominio

Se definirá la entidad **EquipmentLoan** con las siguientes propiedades y restricciones, asegurando la persistencia de los datos históricos tras su anulación lógica[cite: 1]:

| Campo | Tipo | Descripción | Estado en Baja Lógica |
|---|---|---|---|
| `id` | UUID | Identificador único universal generado por el sistema. | **Inmutable** |
| `itemName` | string | Nombre o descripción del material deportivo prestado. | **Inmutable** |
| `status` | enum | Estados posibles: `Loaned`, `Returned`, `Damaged`, `Canceled`. | Cambia a **`Canceled`** |
| `isActive` | boolean | Flag de visibilidad. Determina si el registro es operativo. | Cambia a **`false`** |
| `loanDate` | DateTime | Fecha y hora original en la que se realizó el préstamo. | **Inmutable** |
| `returnDate` | DateTime / NULL | Fecha de devolución. Permanece en NULL si nunca se devolvió. | **Inmutable** (NULL) |
| `canceledDate`| DateTime / NULL | Fecha y hora en la que se ejecutó la baja lógica. | Se registra **`now()`** |
| `memberId` | UUID | Identificador del socio que solicitó el material. | **Inmutable** |
| `notes` | string / NULL | Observaciones adicionales o motivo de la cancelación. | **Actualizado** con motivo |

### 2.2. Contrato de API (Shared DTOs)

**Ubicación:** `@alentapp/shared/dtos`

#### Endpoint: Cancelar Préstamo
**Método:** `PATCH /api/v1/equipment-loans/:id/cancel`

**Request Body** (`CancelEquipmentLoanRequest`)
```typescript
{
  reason?: string;  // Motivo de la cancelación
}
```

**Response Body** (`EquipmentLoanResponse`):
```typescript
{
  id: string;
  itemName: string;
  status: 'Canceled';
  isActive: false;
  loanDate: string;
  returnDate: null;
  canceledDate: string;   //fecha actual
  memberId: string;
  notes?: string;
}
```

### 2.3. Esquema de Persistencia (Prisma)

**Ubicación:** `@alentapp/api/prisma/schema.prisma`

**Se actualiza el modelo para incluir cancelación:**

```prisma
model EquipmentLoan {
  id            String    @id @default(uuid())
  itemName      String
  status        String    // "Loaned", "Returned", "Damaged", "Canceled"
  isActiva      Boolean   // Nueva colunma
  loanDate      DateTime  @default(now())
  returnDate    DateTime?
  canceledDate  DateTime? // Nueva columna
  notes         String?
  
  member        Member    @relation(fields: [memberId], references: [id])
  memberId      String
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([memberId])
  @@index([status])
}
```

---

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto (Repository Interface)

**Ubicación:** `@alentapp/api/src/domain/ports/EquipmentLoanRepository.ts`

```typescript
export interface EquipmentLoanRepository {
  findById(id: string): Promise<EquipmentLoan | null>;
  update(loan: EquipmentLoan): Promise<EquipmentLoan>;
  // NO hay método delete() - se hace baja lógica vía update
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `CancelEquipmentLoanUseCase`

**Ubicación:** `@alentapp/api/src/application/use-cases/CancelEquipmentLoanUseCase.ts`

**Flujo paso a paso:**

1. **Buscar el préstamo:**
   - Consultar `EquipmentLoanRepository.findById(id)`
   - Si no existe, lanzar error 404 Not Found: "El préstamo con ID {id} no existe"

2. **Validar estado actual del préstamo:**
   - Si `loan.status === "Returned"` O `loan.status === "Damaged"`:
     - Lanzar error 409 Conflict: "No se puede cancelar un préstamo que ya fue devuelto"
   - Si `loan.status === "Canceled"`:
     - Lanzar error 409 Conflict: "Este préstamo ya fue cancelado anteriormente"
   - Si `loan.status === "Loaned"`:
     - Continuar con el flujo

3. **Actualizar entidad (baja lógica):**
```typescript
   const canceledLoan: EquipmentLoan = {
     ...loan,
     status: 'Canceled',
     canceledDate: new Date(),
     notes: request.reason 
       ? `${loan.notes ? loan.notes + ' | ' : ''}Cancelado: ${request.reason}`
       : loan.notes
   };
```

4. **Persistir:**
   - Llamar a `EquipmentLoanRepository.update(canceledLoan)`
   - **NUNCA** se llama a un método `delete()` físico

5. **Retornar respuesta:**
   - Mapear entidad a DTO
   - Retornar con código **200 OK**

---

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Préstamo ya devuelto** | No se puede cancelar un préstamo con estado "Returned" o "Damaged". | `409 Conflict` |
| **Préstamo ya cancelado** | El préstamo ya tiene estado "Canceled". | `409 Conflict` |
| **Préstamo inexistente** | El ID proporcionado no existe en la base de datos. | `404 Not Found` |
| **Error de base de datos** | Falla al actualizar el registro en Postgres. | `500 Internal Server Error` |

### Mensajes de Error Sugeridos

```typescript
// 409 Conflict - Ya devuelto
{
  "error": "Conflict",
  "message": "No se puede cancelar un préstamo que ya fue devuelto",
  "code": "CANNOT_CANCEL_RETURNED_LOAN"
}

// 409 Conflict - Ya cancelado
{
  "error": "Conflict",
  "message": "Este préstamo ya fue cancelado anteriormente",
  "code": "ALREADY_CANCELED"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "El préstamo con ID {id} no existe",
  "code": "LOAN_NOT_FOUND"
}
```

---

## 5. Observaciones adicionales

---

## 6. Componentes de Arquitectura Hexagonal

- **Domain**: Entidad `EquipmentLoan` y reglas de negocio para la eliminación lógica: restricción de anulación para préstamos ya procesados (`Returned` o `Damaged`), gestión del flag de visibilidad `isActive` y registro mandatorio de la fecha de cancelación.

- **Application**: Caso de uso `CancelEquipmentLoanUseCase`, responsable de validar las precondiciones de integridad (verificar que el préstamo siga en estado `Loaned`) y orquestar la actualización de los atributos de baja lógica sin invocar métodos de borrado físico.

- **Infrastructure**: Controlador HTTP para `PATCH /api/v1/equipment-loans/{id}/cancel` en Fastify con validación de parámetros vía `zod`, y repositorio implementado con Prisma que asegura la persistencia de los estados históricos y aplica filtros de exclusión por `isActive` en las consultas operativas.

---

## 7. Plan de Implementación

1. Actualizar el modelo `EquipmentLoan` en el esquema de Prisma para incluir los campos `isActive` (boolean) y `canceledDate` (DateTime?).
2. Implementar en la entidad `EquipmentLoan` las validaciones necesarias para impedir la transición a `Canceled` si el préstamo ya posee una fecha de devolución registrada.
3. Desarrollar `CancelEquipmentLoanUseCase` asegurando que la operación de "borrado" sea en realidad una actualización parcial de los campos de visibilidad y estado.
4. Configurar la ruta `PATCH` integrando middlewares de autorización para restringir la acción a perfiles administrativos y validar el formato UUID del identificador.
5. Realizar pruebas manuales con un cliente HTTP (Postman/Insomnia) para constatar que, tras la baja, el registro permanece en la base de datos pero deja de ser visible en los listados generales del sistema.
