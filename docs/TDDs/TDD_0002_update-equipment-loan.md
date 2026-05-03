# TDD-0002: Devolución de Préstamo de Equipamiento (Update EquipmentLoan)

| identificación | 0002 |
|---------------|---|
| estado        | Propuesto |
| autor         | Franco Oyhenart |
| fecha         | 2026-05-03 |
| título        | Modificacion de prestamo |

---

## 1. Contexto de Negocio (El "Qué")

### 1.1. Objetivo

Permitir registrar la devolución de material deportivo prestado, actualizando el estado del préstamo y la fecha de devolución para mantener el control del inventario.

### 1.2. User Personas

- **Administrativo del Club**: Necesita registrar cuándo un socio devuelve el material y en qué estado lo entrega.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Devolución Exitosa
- **Como** administrativo, **quiero** registrar la devolución de un préstamo, **para** actualizar el inventario y liberar el material.
- **Escenario de éxito**: Al registrar la devolución de un préstamo con estado "Loaned", el sistema cambia el estado a "Returned", registra la fecha actual de devolución y retorna código 200 OK.
- **Escenario de fallo**: El sistema no puede conectarse a la base de datos; retorna error 500 Internal Server Error.

#### Historia de Usuario 2: Devolución con Material Dañado
- **Como** administrativo, **quiero** poder marcar un préstamo como "Damaged" al devolverlo, **para** llevar control del estado del equipamiento.
- **Escenario de éxito**: Al registrar una devolución con estado "Damaged", el sistema actualiza el préstamo y permite agregar notas sobre el daño.
- **Escenario de fallo**: Se intenta marcar como "Damaged" sin proporcionar notas explicativas; el sistema retorna error 400 Bad Request.

#### Historia de Usuario 3: Validación de Préstamo Ya Devuelto
- **Como** sistema, **quiero** evitar devolver dos veces el mismo préstamo, **para** mantener la integridad de los datos.
- **Escenario de éxito**: El préstamo tiene estado "Loaned" y se procesa correctamente.
- **Escenario de fallo**: Se intenta devolver un préstamo que ya tiene estado "Returned"; el sistema retorna error 409 Conflict: "Este préstamo ya fue devuelto anteriormente".

---

## 2. Diseño Técnico (El "Cómo")

### 2.1. Modelo de Dominio (Entidad)

**Ubicación:** `@alentapp/api/src/domain/entities/EquipmentLoan.ts`

```typescript
export interface EquipmentLoan {
  id: string;
  itemName: string;
  status: 'Loaned' | 'Returned' | 'Damaged';
  loanDate: Date;
  returnDate?: Date;
  memberId: string;
  notes?: string;
}
```

### 2.2. Contrato de API (Shared DTOs)

**Ubicación:** `@alentapp/shared/dtos`

#### Endpoint: Registrar Devolución
**Método:** `PATCH /api/v1/equipment-loans/:id/return`

**Request Body** (`ReturnEquipmentLoanRequest`):
```typescript
{
  status: 'Returned' | 'Damaged';
  notes?: string;
}
```

**Response Body** (`EquipmentLoanResponse`):
```typescript
{
  id: string;
  itemName: string;
  status: 'Returned' | 'Damaged';
  loanDate: string;
  returnDate: string;    //fecha actaul
  memberId: string;
  notes?: string;
}
```

### 2.3. Esquema de Persistencia (Prisma)

El modelo ya existe, solo se actualiza:

```prisma
model EquipmentLoan {
  id          String    @id @default(uuid())
  itemName    String
  status      String
  loanDate    DateTime  @default(now())
  returnDate  DateTime?
  notes       String?
  
  member      Member    @relation(fields: [memberId], references: [id])
  memberId    String
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
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
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `ReturnEquipmentLoanUseCase`

**Ubicación:** `@alentapp/api/src/application/use-cases/ReturnEquipmentLoanUseCase.ts`

**Flujo paso a paso:**

1. **Validar datos de entrada:**
   - Comprobar que `status` sea "Returned" o "Damaged"
   - Si `status === "Damaged"`, verificar que `notes` no esté vacío

2. **Buscar el préstamo:**
   - Consultar `EquipmentLoanRepository.findById(id)`
   - Si no existe, lanzar error 404 Not Found: "El préstamo con ID {id} no existe"

3. **Validar estado actual del préstamo:**
   - Si `loan.status === "Returned"` O `loan.status === "Damaged"`:
     - Lanzar error 409 Conflict: "Este préstamo ya fue devuelto anteriormente"
   - Si `loan.status === "Loaned"`:
     - Continuar con el flujo

4. **Actualizar entidad:**
```typescript
   const updatedLoan: EquipmentLoan = {
     ...loan,
     status: request.status,
     returnDate: new Date(),
     notes: request.notes || loan.notes
   };
```

5. **Persistir:**
   - Llamar a `EquipmentLoanRepository.update(updatedLoan)`

6. **Retornar respuesta:**
   - Mapear entidad a DTO
   - Retornar con código **200 OK**

---

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Préstamo ya devuelto** | El préstamo tiene estado "Returned" o "Damaged". | `409 Conflict` |
| **Préstamo inexistente** | El ID proporcionado no existe en la base de datos. | `404 Not Found` |
| **Status inválido** | El campo `status` debe ser "Returned" o "Damaged". | `400 Bad Request` |
| **Damaged sin notas** | Si `status` es "Damaged", el campo `notes` es obligatorio. | `400 Bad Request` |
| **Error de base de datos** | Falla al actualizar el registro en Postgres. | `500 Internal Server Error` |

### Mensajes de Error Sugeridos

```typescript
// 409 Conflict
{
  "error": "Conflict",
  "message": "Este préstamo ya fue devuelto anteriormente",
  "code": "ALREADY_RETURNED"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "El préstamo con ID {id} no existe",
  "code": "LOAN_NOT_FOUND"
}

// 400 Bad Request
{
  "error": "Bad Request",
  "message": "Si el material está dañado, debe proporcionar notas explicativas",
  "code": "NOTES_REQUIRED_FOR_DAMAGED"
}
```
