# TDD-0003: Cancelación de Préstamo de Equipamiento (Delete EquipmentLoan)

| identificación | 0003 |
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

#### Historia de Usuario 2: Validación de Préstamo Ya Procesado
- **Como** sistema, **quiero** evitar cancelar préstamos que ya fueron devueltos, **para** mantener la integridad del historial.
- **Escenario de éxito**: El préstamo tiene estado "Loaned" y se cancela correctamente.
- **Escenario de fallo**: Se intenta cancelar un préstamo que ya tiene estado "Returned" o "Damaged"; el sistema retorna error 409 Conflict: "No se puede cancelar un préstamo que ya fue devuelto".

#### Historia de Usuario 3: Preservación del Registro
- **Como** administrador del sistema, **quiero** que los préstamos cancelados permanezcan en la base de datos, **para** mantener auditoría completa.
- **Escenario de éxito**: El préstamo cancelado permanece en la base de datos con estado "Canceled" y puede ser consultado en el historial.
- **Escenario de fallo**: No aplica - nunca se elimina físicamente.

---

## 2. Diseño Técnico (El "Cómo")

### 2.1. Modelo de Dominio (Entidad)

**Ubicación:** `@alentapp/api/src/domain/entities/EquipmentLoan.ts`

**IMPORTANTE: Se agrega el estado "Canceled"**

```typescript
export interface EquipmentLoan {
  id: string;
  itemName: string;
  status: 'Loaned' | 'Returned' | 'Damaged' | 'Canceled';  //Se agrega Canceled
  loanDate: Date;
  returnDate?: Date;
  canceledDate?: Date;
  memberId: string;
  notes?: string;
}
```

### 2.2. Contrato de API (Shared DTOs)

**Ubicación:** `@alentapp/shared/dtos`

#### Endpoint: Cancelar Préstamo
**Método:** `DELETE /api/v1/equipment-loans/:id`

O alternativamente:

**Método:** `PATCH /api/v1/equipment-loans/:id/cancel`

**Request Body** (`CancelEquipmentLoanRequest`) - Opcional:
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
