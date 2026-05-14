# TDD-0015: Devolución de Préstamo de Equipamiento (Update EquipmentLoan)

| identificación | 0015 |
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
- **Escenario de éxito**: Al registrar una devolución con estado "Damaged", el sistema actualiza el préstamo y se debe agregar notas sobre el daño.
- **Escenario de fallo**: Se intenta marcar como "Damaged" sin proporcionar notas explicativas; el sistema retorna error 400 Bad Request.

### 1.4. Criterios Generales

1. Solo los registros con estado `Loaned` son elegibles para la actualización de devolución.
2. El cambio de estado y la grabación de `returnDate` deben ejecutarse en una única transacción de base de datos.
3. No se permite la modificación de los campos `memberId`, `loanDate` ni `itemName` durante el proceso de devolución.
4. El campo `notes` es obligatorio y debe tener una longitud mínima (ej. 10 caracteres) si el estado es `Damaged`.
5. La fecha de devolución (`returnDate`) debe ser generada por el servidor, ignorando cualquier fecha enviada por el cliente para evitar fraude.
6. Una vez que un préstamo alcanza el estado `Returned` o `Damaged`, no puede volver a estado `Loaned` bajo ninguna circunstancia.

---

## 2. Diseño Técnico (El "Cómo")

### 2.1. Modelo de Dominio (Entidad)

Se utilizará la entidad **EquipmentLoan** con las siguientes restricciones:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único del préstamo. |
| `itemName` | string | Nombre del material. Inmutable en este flujo. |
| `status` | enum | Estados: `Loaned`, `Returned`, `Damaged`. |
| `loanDate` | DateTime | Fecha de inicio. Inmutable. |
| `returnDate` | DateTime / NULL | Fecha de devolución. Generada por el sistema al actualizar. |
| `memberId` | UUID | ID del socio. Inmutable. |
| `notes` | string / NULL | Obligatorio si `status` es `Damaged`. |

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
  notes?: string; //No es un campo obligatorio porque si el estado es Returned no precisa nota.
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

---

## 5. Observaciones adicionales

---

## 6. Componentes de Arquitectura Hexagonal

- **Domain**: Entidad `EquipmentLoan` y reglas de negocio asociadas a la transición de estados: validación obligatoria del estado previo `Loaned`, restricción de inmutabilidad para campos de origen (`memberId`, `loanDate`) y lógica de obligatoriedad del campo `notes` ante daños detectados[cite: 1].

- **Application**: Caso de uso `ReturnEquipmentLoanUseCase`, encargado de orquestar la validación de las precondiciones de negocio, asegurar la integridad de los datos de entrada y coordinar la persistencia atómica a través del puerto del repositorio[cite: 1].

- **Infrastructure**: Controlador HTTP para `PATCH /api/v1/equipment-loans/{id}/return` implementado en Fastify con validación de esquema mediante `zod`, y adaptador de persistencia `EquipmentLoanRepository` desarrollado con Prisma para la interacción con PostgreSQL[cite: 1].

---

## 7. Plan de Implementación

1. Definir las reglas de validación y transición de estados dentro de la entidad `EquipmentLoan` en la capa de dominio.
2. Implementar `ReturnEquipmentLoanUseCase` aplicando TDD para cubrir escenarios de éxito (devolución normal) y de fallo (falta de notas en material dañado o estado inválido).
3. Extender el repositorio en la capa de infraestructura para incluir el método `update`, asegurando que la operación sea atómica.
4. Registrar el endpoint `PATCH` en el servidor Fastify, integrando el esquema de validación `zod` y los middlewares de seguridad para el rol administrativo.
5. Verificar el flujo completo utilizando un cliente HTTP, validando que el sistema realice correctamente el `rollback` ante errores y que bloquee intentos de doble devolución.
