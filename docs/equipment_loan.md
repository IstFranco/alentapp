# TDD-06: Gestión de Préstamos de Equipamiento (EquipmentLoan)

*Estado:* Propuesto  
*Autor:* Franco Oyhenart  
*Fecha:* 2026-04-30

---

## 1. Contexto de Negocio (El "Qué")

### 1.1. Objetivo

Gestionar el préstamo de materiales deportivos (raquetas, pelotas, pesas, etc.) a los socios del Club Alentapp, asegurando el control del inventario y el cumplimiento estricto de las restricciones por categoría de socio establecidas en las reglas de negocio.

### 1.2. User Personas

- *Administrativo del Club*: Necesita registrar qué material se presta, a qué socio, y controlar las devoluciones. Debe asegurar que solo socios habilitados (Senior o Lifetime) accedan a este beneficio.
- *Socio Senior/Lifetime*: Quiere solicitar equipamiento para sus actividades deportivas con la garantía de que el sistema controla disponibilidad y estado del material.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Préstamo Exitoso
- *Como* administrativo, *quiero* registrar un préstamo de equipamiento a un socio habilitado, *para* tener control del inventario y responsabilidades.
- *Escenario de éxito*: Un socio de categoría "Senior" solicita una raqueta; el sistema registra el préstamo con estado "Loaned", asigna un ID único y retorna la confirmación con código 201 Created.
- *Escenario de fallo*: Un socio de categoría "Senior" intenta solicitar material pero el sistema no puede conectarse a la base de datos; el sistema retorna error 500 Internal Server Error.

#### Historia de Usuario 2: Restricción por Categoría
- *Como* administrativo, *quiero* que el sistema rechace automáticamente préstamos a socios "Cadet", *para* cumplir con la política del club.
- *Escenario de éxito*: El sistema valida correctamente que el socio es "Senior" o "Lifetime" y permite continuar con el registro del préstamo.
- *Escenario de fallo*: Un socio de categoría "Cadet" intenta solicitar material; el sistema debe rechazar la operación con un error 403 Forbidden informando "Los socios de categoría Cadet no están autorizados para solicitar préstamos de equipamiento".

#### Historia de Usuario 3: Devolución de Material
- *Como* administrativo, *quiero* registrar la devolución de un préstamo, *para* actualizar el inventario y el estado del material.
- *Escenario de éxito*: Al registrar la devolución de un préstamo con estado "Loaned", el sistema cambia el estado a "Returned", registra la fecha de devolución actual y retorna código 200 OK.
- *Escenario de fallo*: Se intenta registrar la devolución de un préstamo que ya tiene estado "Returned"; el sistema retorna error 409 Conflict con el mensaje "Este préstamo ya fue devuelto anteriormente".

---

## 2. Diseño Técnico (El "Cómo")

### 2.1. Modelo de Dominio (Entidad)

*Ubicación:* @alentapp/api/src/domain/entities/EquipmentLoan.ts

typescript
export interface EquipmentLoan {
  id: string;
  itemName: string;
  status: 'Loaned' | 'Returned' | 'Damaged';
  loanDate: Date;
  returnDate?: Date;
  memberId: string;
  notes?: string;
}


*Nota:* Esta interfaz no debe contener tipos específicos de Prisma ni de bases de datos, solo representa el dominio puro.

### 2.2. Contrato de API (Shared DTOs)

*Ubicación:* @alentapp/shared/dtos

#### Endpoint: Crear Préstamo
*Método:* POST /api/v1/equipment-loans

*Request Body* (CreateEquipmentLoanRequest):
typescript
{
  itemName: string;
  memberId: string;
  notes?: string;
}


*Response Body* (EquipmentLoanResponse):
typescript
{
  id: string;
  itemName: string;
  status: 'Loaned';
  loanDate: string;
  returnDate: null;
  memberId: string;
}


#### Endpoint: Registrar Devolución
*Método:* PATCH /api/v1/equipment-loans/:id/return

*Request Body* (ReturnEquipmentLoanRequest):
typescript
{
  status: 'Returned' | 'Damaged';
  notes?: string;
}


#### Endpoint: Listar Préstamos
*Método:* GET /api/v1/equipment-loans?memberId=xxx&status=Loaned

*Query Parameters:*
- memberId (opcional): Filtrar por socio
- status (opcional): Filtrar por estado

### 2.3. Esquema de Persistencia (Prisma)

*Ubicación:* @alentapp/api/prisma/schema.prisma

prisma
model EquipmentLoan {
  id          String    @id @default(uuid())
  itemName    String
  status      String    // "Loaned", "Returned", "Damaged"
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


---

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto (Repository Interface)

Un puerto conectado a la *base de datos*


### 3.2. Lógica del Caso de Uso

*Caso de Uso:* CreateEquipmentLoanUseCase

*Flujo paso a paso:*

1. *Validar datos de entrada:*
   - Comprobar que itemName no esté vacío
   - Comprobar que memberId sea un UUID válido

2. *Verificar existencia del socio:*
   - Consultar MemberRepository.findById(memberId)
   - Si no existe, lanzar error 404

3. *Aplicar Regla de Negocio Crítica (Restricción por Categoría):*
   - Si member.category === "Cadet":
     - Lanzar error de validación con código 403 Forbidden
     - Mensaje: "Los socios Cadet no tienen permitido solicitar préstamos de equipamiento"
   - Si member.category === "Senior" o "Lifetime":
     - Continuar con el flujo

4. *Crear entidad de dominio:*
typescript
   const loan: EquipmentLoan = {
     id: generateUUID(),
     itemName: request.itemName,
     status: 'Loaned',
     loanDate: new Date(),
     returnDate: undefined,
     memberId: request.memberId,
     notes: request.notes
   };


5. *Persistir:*
   - Llamar a EquipmentLoanRepository.create(loan)

6. *Retornar respuesta:*
   - Mapear entidad a DTO y devolver con código 201 Created

---

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| *Socio no habilitado* | Categoría "Cadet" tiene prohibido solicitar material según regla de negocio. | 403 Forbidden |
| *Socio inexistente* | El memberId proporcionado no existe en la base de datos. | 404 Not Found |
| *Datos incompletos* | Falta el nombre del ítem (itemName) o el ID del socio (memberId). | 400 Bad Request |
| *Préstamo ya devuelto* | Se intenta devolver un préstamo que ya tiene status: 'Returned'. | 409 Conflict |
| *Préstamo inexistente* | Se intenta actualizar un préstamo con un ID que no existe. | 404 Not Found |
| *Error de base de datos* | Falla de conexión con el contenedor de Postgres. | 500 Internal Server Error |

### Mensajes de Error Sugeridos

typescript
// 403 Forbidden
{
  "error": "Forbidden",
  "message": "Los socios de categoría Cadet no están autorizados para solicitar préstamos de equipamiento",
  "code": "CATEGORY_RESTRICTION"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "El socio con ID {memberId} no existe",
  "code": "MEMBER_NOT_FOUND"
}
