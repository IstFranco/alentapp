# TDD-0014: Alta de Préstamo de Equipamiento (Create EquipmentLoan)

| identificación | 0004 |
|---------------|---|
| estado        | Propuesto |
| autor         | Franco Oyhenart |
| fecha         | 2026-05-03 |
| título        | Registro de prestamo de equipamiento |

---

## 1. Contexto de Negocio (El "Qué")

### 1.1. Objetivo

Permitir el registro de nuevos préstamos de material deportivo a socios del club, validando que solo socios de categoría "Senior" o "Lifetime" puedan solicitar equipamiento, cumpliendo con la regla de negocio de restricción por categoría.

### 1.2. User Personas

- **Administrativo del Club**: Necesita registrar qué material se presta y a qué socio, asegurando que solo socios habilitados accedan a este beneficio.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Alta Exitosa
- **Como** administrativo, **quiero** registrar un préstamo de equipamiento a un socio habilitado, **para** tener control del inventario.
- **Escenario de éxito**: Un socio de categoría "Senior" solicita una raqueta; el sistema registra el préstamo con estado "Loaned", asigna un ID único y retorna código 201 Created.
- **Escenario de fallo**: El administrativo cargo un idInvalido de socio o equipamiento, devuelve un bad request.
- **Escenario de fallo**: El administrativo carga un itemName muy corto o vacio, devuelve un bad request.

#### Historia de Usuario 2: Restricción por Categoría (Regla de Negocio Crítica)
- **Como** administrativo, **quiero** que el sistema rechace automáticamente préstamos a socios "Cadet", **para** cumplir con la política del club.
- **Escenario de éxito**: El sistema valida correctamente que el socio es "Senior" o "Lifetime" y permite el registro.
- **Escenario de fallo**: Un socio de categoría "Cadet" intenta solicitar material; el sistema rechaza con error 403 Forbidden: "Los socios de categoría Cadet no están autorizados para solicitar préstamos de equipamiento".

### 1.4. Criterios Generales

1. Solo socios de categoría **Senior** o **Lifetime** están habilitados para solicitar préstamos.
2. Todo préstamo nuevo se registra inicialmente con el estado **Loaned**.
3. El campo `loanDate` se genera automáticamente con la fecha y hora del sistema al momento de la creación.
4. Un préstamo no puede ser registrado si el `memberId` no corresponde a un socio activo en el sistema.
5. Solo usuarios con rol **Administrativo** pueden registrar nuevos préstamos.
6. El campo `itemName` debe tener una longitud mínima de 3 caracteres para evitar registros ambiguos.

---

## 2. Diseño Técnico (El "Cómo")

### 2.1. Modelo de Dominio

Se definirá la entidad **EquipmentLoan** con las siguientes propiedades y restricciones:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único universal generado por el sistema. |
| `itemName` | string | Nombre o descripción del material prestado (mín. 3 caracteres). |
| `status` | enum | Estado del préstamo. Valores: `Loaned`, `Returned`, `Damaged`. |
| `loanDate` | DateTime | Fecha y hora en la que se realiza el préstamo. |
| `returnDate` | DateTime / NULL | Fecha de devolución. Se inicializa en NULL. |
| `memberId` | UUID | Identificador del socio que solicita el material. |
| `notes` | string / NULL | Observaciones adicionales sobre el estado del material. |

### 2.2. Contrato de API (Shared DTOs)

**Ubicación:** `@alentapp/shared/dtos`

#### Endpoint: Crear Préstamo
**Método:** `POST /api/v1/equipment-loans`

**Request Body** (`CreateEquipmentLoanRequest`):
```typescript
{
  itemName: string;
  memberId: string;
  notes?: string;
}
```

**Response Body** (`EquipmentLoanResponse`):
```typescript
{
  id: string;
  itemName: string;
  status: 'Loaned';
  loanDate: string;
  returnDate: null;
  memberId: string;
  notes?: string;
}
```

### 2.3. Esquema de Persistencia (Prisma)

**Ubicación:** `@alentapp/api/prisma/schema.prisma`

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
  create(loan: EquipmentLoan): Promise<EquipmentLoan>;
}
```

**Ubicación:** `@alentapp/api/src/domain/ports/MemberRepository.ts`

```typescript
export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `CreateEquipmentLoanUseCase`

**Ubicación:** `@alentapp/api/src/application/use-cases/CreateEquipmentLoanUseCase.ts`

**Flujo paso a paso:**

1. **Validar datos de entrada:**
   - Comprobar que `itemName` no esté vacío (mínimo 3 carácter)
   - Comprobar que `memberId` sea un UUID válido

2. **Verificar existencia del socio:**
   - Consultar `MemberRepository.findById(memberId)`
   - Si no existe, lanzar error 404 Not Found: "El socio con ID {memberId} no existe"

3. **Aplicar Regla de Negocio Crítica (Restricción por Categoría):**
   - Obtener `member.category`
   - Si `member.category === "Cadet"`:
     - Lanzar error 403 Forbidden
     - Mensaje: "Los socios de categoría Cadet no están autorizados para solicitar préstamos de equipamiento"
   - Si `member.category === "Senior"` O `member.category === "Lifetime"`:
     - Continuar con el flujo

4. **Crear entidad de dominio:**
```typescript
   const loan: EquipmentLoan = {
     id: generateUUID(),
     itemName: request.itemName,
     status: 'Loaned',
     loanDate: new Date(),
     returnDate: undefined,
     memberId: request.memberId,
     notes: request.notes
   };
```

5. **Persistir:**
   - Llamar a `EquipmentLoanRepository.create(loan)`

6. **Retornar respuesta:**
   - Mapear entidad a DTO
   - Retornar con código **201 Created**

---

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Socio categoría Cadet** | Categoría "Cadet" tiene prohibido solicitar material (regla de negocio). | `403 Forbidden` |
| **Socio inexistente** | El `memberId` proporcionado no existe en la base de datos. | `404 Not Found` |
| **itemName vacío** | El campo `itemName` es requerido y no puede estar vacío. | `400 Bad Request` |
| **itemName corto** | El campo `itemName` debe contener al menos 3 caracteres. | `400 Bad Request` |
| **memberId vacío** | El campo `memberId` es requerido. | `400 Bad Request` |
| **memberId formato inválido** | El `memberId` debe ser un UUID válido. | `400 Bad Request` |
| **Error de base de datos** | Falla de conexión con Postgres o error al insertar. | `500 Internal Server Error` |

### Mensajes de Error Sugeridos

```typescript
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

// 400 Bad Request
{
  "error": "Bad Request",
  "message": "El nombre del ítem es requerido",
  "code": "VALIDATION_ERROR"
}
```

---

## 5. Observaciones adicionales

---

## 6. Componentes de Arquitectura Hexagonal

**Domain**: Entidad `EquipmentLoan` y reglas de negocio: validación de categoría de socio (Senior/Lifetime), estado inicial obligatorio `Loaned`, y validación de atributos.

**Application**: Caso de uso `CreateEquipmentLoanUseCase`, encargado de orquestar la validación de identidad, la aplicación de restricciones y la llamada al puerto de persistencia.

**Infrastructure**: Controlador HTTP para `POST /api/v1/equipment-loans`, middleware de autenticación (Admin check) y repositorios implementados con Prisma.

---

## 7. Plan de Implementación

1. Definir la entidad de dominio e interfaz `EquipmentLoanRepository`.
2. Implementar `CreateEquipmentLoanUseCase` con las validaciones de negocio.
3. Actualizar el esquema de Prisma y ejecutar la migración.
4. Registrar la ruta en Fastify con validación de esquema y middleware de rol.
5. Realizar pruebas de integración cubriendo escenarios de éxito y restricciones.
