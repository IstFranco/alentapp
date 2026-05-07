# TDD-0007: Registro de nuevo Locker

| Identificación | 07 |
|---|---|
| Estado | Propuesto |
| Autor | Brenda Belen Conti |
| Fecha | 2026-05-07 |

## 1. Contexto de Negocio

### 1.1. Objetivo
Asegurar la correcta creación de casilleros en el sistema Alentapp, garantizando la **unicidad del identificador numérico** y la integridad de los estados iniciales.

### 1.2. User Persona

**Administrativo**: Este usuario es responsable de mantener el orden y la disponibilidad de la infraestructura del club. Al interactuar con esta funcionalidad, espera tener un control total e inmediato sobre el inventario de casilleros. Busca poder registrar nuevas unidades físicas en el sistema.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Alta de Nuevo Locker
**Como** administrador del club, **quiero** registrar un nuevo casillero físico en el sistema **para** ampliar el inventario disponible y que los socios puedan utilizarlo.

- **Escenario de éxito:** Al ingresar los datos requeridos con un número de casillero inédito, el sistema lo registra exitosamente y le asigna el estado "Disponible" por defecto.
- **Escenario de fallo:** Si se intenta registrar un casillero con un número que ya existe en la base de datos, el sistema debe bloquear la operación para mantener la integridad relacional y mostrar un mensaje de error indicando que el número ya está en uso.

#### Historia de Usuario 2: Validación de Identificación Única de Lockers
**Como** administrador del club, **quiero** que el sistema valide que el número de cada casillero sea único **para** evitar confusiones en las asignaciones y errores en la base de datos.

- **Escenario de éxito:** Al registrar un nuevo locker con un número que no existe en el sistema, la operación se completa con éxito.
- **Escenario de fallo:** Si se intenta registrar o editar un locker con un número que ya pertenece a otro casillero existente, el sistema debe impedir la acción y mostrar un mensaje de error (ej: "El número de casillero ya se encuentra registrado").

### 1.4. Criterios Generales

1. Un casillero no puede ser asignado a un socio si su estado es `Maintenance`.
2. No pueden existir dos casilleros con el mismo `number` en el sistema.
3. Todo casillero se crea con estado `Available` y sin socio asignado (`member_id: null`).
4. Solo usuarios con rol administrativo pueden registrar nuevos casilleros.
5. Los campos `number` y `location` son obligatorios para la creación.
6. El campo `number` debe ser un entero positivo mayor a cero.

## 2. Diseño Técnico

### 2.1. Modelo de Dominio

Se definirá la entidad **Locker** con las siguientes propiedades y restricciones:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único universal generado por el sistema |
| `number` | int | Identificador numérico del locker en el club, debe ser único |
| `location` | string | Ubicación del locker. Editable |
| `status` | enum | Estado del locker. Posibles valores: `Available`, `Occupied`, `Maintenance` |
| `member_id` | UUID / NULL | Identificador del socio que reserva el locker. Permite NULL |


### 2.2. Contrato de API (Shared DTOs)

Definiremos los tipos en el paquete compartido para asegurar la gestión:

#### Endpoint: Crear Casillero

**Método:** `POST /api/v1/lockers`

**Request Body** (`CreateLockerDto`):
```typescript
{
  number: int;      // inmutable luego de la creación, debe ser único
  location: string; // editable
}
```

**Response** (`201 Created`):
```typescript
{
  id: string;            // UUID generado por el sistema
  number: int;           // identificador numérico único
  location: string;      // ubicación del casillero
  status: enum;          // por defecto se crea en 'Available'
  member_id: string | null; // por defecto se inicializa en null
}
```

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

```typescript
export interface LockerRepository {
  create(locker: Locker): Promise<Locker>;
  findById(id: string): Promise<Locker | null>;
  findByNumber(number: number): Promise<Locker | null>;
  findByStatus(status: string): Promise<Locker[]>;
  update(id: string, data: Partial<Omit<Locker, 'id' | 'number'>>): Promise<Locker>;
}
```

### 3.2. Lógica del Caso de Uso

#### CU-01: Alta de Casillero

**Descripción:** Permite a un administrador registrar un nuevo casillero físico en el sistema, definiendo su número de identificación y ubicación.

**Actor Principal:** Administrador

**Precondiciones:**
1. El administrador debe estar autenticado en el sistema con permisos o rol de gestión de inventario.
2. El número de casillero a registrar no debe existir previamente en el sistema.

**Flujo Principal (Escenario de Éxito):**
1. El administrador ingresa al módulo de "Gestión de Lockers".
2. Selecciona la opción "Nuevo Casillero" (o "Agregar").
3. El sistema muestra un formulario solicitando el Número (`number`) y la Ubicación (`location`).
4. El administrador completa los datos requeridos y envía el formulario.
5. El sistema envía una petición `POST /api/v1/lockers` con los datos en el body.
6. El sistema valida los datos de entrada y verifica en la base de datos que el `number` no esté registrado.
7. El sistema crea el registro en la base de datos, generando un nuevo `id` (UUID) y asignando automáticamente el `status` inicial como `"Available"` y el `member_id` en `null`.
8. El sistema muestra un mensaje de éxito ("Casillero registrado correctamente") y actualiza el listado en pantalla.

**Flujos Alternativos (Escenarios de Fallo):**

- **A1. Número de Casillero Duplicado:** En el paso 6, el sistema detecta que el `number` ingresado ya pertenece a otro casillero existente. El sistema rechaza la creación, no guarda nada en la base de datos y muestra: *"Error: El número de casillero ingresado ya existe. Por favor, asigne un identificador único."*
- **A2. Error de Permisos:** En el paso 5, el sistema verifica que el usuario autenticado no tiene rol de administrador. El sistema deniega la solicitud y muestra: *"Acceso denegado: no cuenta con los permisos necesarios para registrar nuevos casilleros."*
- **A3. Falla de Conexión / Infraestructura:** En el paso 7, ocurre un problema al intentar insertar el registro en la base de datos. El sistema aborta la operación y muestra un mensaje indicando que ocurrió un error interno en el servidor.

**Postcondiciones:**
- El nuevo casillero se incorpora a la base de datos y al listado general.
- El casillero queda inmediatamente disponible (`"Available"`) para que cualquier socio lo pueda reservar.

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|---|---|---|
| **Datos Faltantes** | Los campos obligatorios (`number`, `location`) deben estar presentes en el body | `400` |
| **Number Duplicado** | No pueden existir dos casilleros con el mismo `number` | `409` |
| **Error de Infraestructura** | Falla la conexión con la base de datos | `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de Datos
Se pueden utilizar librerías como `zod` para validar los datos de entrada en los DTOs, asegurando que los campos requeridos estén presentes, que `number` sea un entero positivo, y que los valores de `status` coincidan estrictamente con el Enum (`Available`, `Occupied`, `Maintenance`).

### 5.2. Consideraciones de Negocio
- El campo `number` no debe poder modificarse una vez creado el casillero para mantener la integridad relacional.

### 5.3. Consideraciones de Seguridad
- Los endpoints de creación deben estar restringidos exclusivamente a usuarios con rol administrativo.

### 5.4. Posibles Mejoras Futuras
- **Creación en Lote (Bulk Insert):** Implementar un nuevo endpoint (ej. `POST /api/v1/lockers/bulk`) que permita registrar múltiples casilleros simultáneamente ingresando un rango (por ejemplo, del locker 1 al 50).
- **Trazabilidad en la Arquitectura Relacional:** Incorporar campos de auditoría en el modelo relacional (`created_at`, `updated_at`, `created_by_admin_id`) para llevar control de qué usuario administrativo dio de alta cada unidad y cuándo.
- **Categorización por Tamaño:** Ampliar el modelo de dominio con un atributo de dimensiones del locker (ej: `size: 'Small' | 'Medium' | 'Large'`) para enriquecer los filtros de búsqueda.
- **Integración Visual (UX/UI):** Evolucionar el campo `location` hacia un sistema de coordenadas o sectores predefinidos para permitir al frontend renderizar un mapa interactivo o grilla visual del club.
- **Generación Automática de Códigos QR:** Desarrollar un servicio que, tras la creación exitosa del registro, genere un código QR único vinculado al UUID del locker para facilitar su identificación física.


## 6. Componentes de Arquitectura Hexagonal

**Domain**: Entidad Locker y reglas de negocio asociadas a la creación de casilleros: número obligatorio, número único, número mayor a cero, ubicación obligatoria, ubicación perteneciente a una locación permitida, estado inicial Available y casillero sin socio asignado.
**Application**: Caso de uso CreateLockerUseCase, encargado de validar los datos de entrada, verificar que no exista otro casillero con el mismo número y solicitar la persistencia del nuevo casillero.
**Infrastructure**: Controlador HTTP para POST /api/v1/lockers y repositorio de casilleros implementado con Prisma.

## 7. Plan de Implementación

1. Definir la entidad `Locker` e interfaz `LockerRepository` en el dominio.
2. Implementar `CreateLockerUseCase` con validación de unicidad y valores por defecto.
3. Definir el modelo y ejecutar BBDD.
4. Registrar la ruta `POST /api/v1/lockers` en Fastify con validación `zod` y middleware de rol administrativo.
5. Verificar el flujo completo con un cliente HTTP cubriendo escenarios de éxito y fallo.
