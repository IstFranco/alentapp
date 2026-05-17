# TDD-0009: Modificación de Locker

| Identificación | 09 |
|---|---|
| Estado | Propuesto |
| Autor | Brenda Belen Conti |
| Fecha | 2026-05-13|


## 1. Contexto de Negocio

### 1.1. Objetivo
Asegurar la correcta actualización de los datos y el estado operativo de los casilleros en el sistema Alentapp. El proceso debe garantizar que los cambios reflejen con exactitud la realidad física de la infraestructura, previniendo estrictamente la modificación de casilleros que se encuentren en uso por un socio y protegiendo la inmutabilidad del número identificador para preservar la integridad del modelo relacional.

### 1.2. User Persona

**Administrativo:** Este usuario es responsable de mantener el orden y la disponibilidad de la infraestructura del club. Es el único actor autorizado para auditar y gestionar los cambios de estado operativo de los lockers.

**Socio:** Este usuario busca comodidad y seguridad para sus pertenencias mientras utiliza las instalaciones del club. Espera poder visualizar qué casilleros están disponibles, reservar uno de forma ágil y liberarlo fácilmente al finalizar su actividad deportiva.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Alta de Reserva (Actualización a "Occupied")
**Como** socio del club, **quiero** poder reservar un casillero específico **para** resguardar mis pertenencias de forma segura mientras utilizo las instalaciones.

- **Escenario de éxito:** Al seleccionar un casillero con estado `Available`, el sistema asigna mi `member_id` al casillero y actualiza su estado a `Occupied` de forma inmediata, confirmando la reserva.
- **Escenario de fallo:** Si el casillero cambió a `Occupied` por otro socio o a `Maintenance` por un administrador durante mi operación, el sistema debe impedir la actualización y mostrar: *"Este casillero ya no se encuentra disponible."*

#### Historia de Usuario 2: Baja de Reserva (Actualización a "Available")
**Como** socio del club, **quiero** finalizar mi reserva **para** liberar mis pertenencias y que el casillero quede habilitado para otros usuarios.

- **Escenario de éxito:** Al confirmar la finalización, el sistema elimina mi `member_id` (pasa a `null`) y actualiza el estado del casillero a `Available` de forma inmediata.
- **Escenario de fallo:** Si intento liberar un casillero que no me pertenece o si ocurre un error de red, el sistema debe abortar la actualización, mantener el estado `Occupied` y mi asignación para evitar inconsistencias.

#### Historia de Usuario 3: Bloqueo por Mantenimiento (Actualización a "Maintenance")
**Como** administrador del club, **quiero** modificar el estado de un casillero a mantenimiento **para** inhabilitar su uso en caso de roturas, limpieza profunda o fallas en la cerradura.

- **Escenario de éxito:** Al seleccionar un casillero en estado `Available`, el sistema actualiza su estado a `Maintenance`, ocultándolo o bloqueándolo en la vista de los socios para futuras reservas.
- **Escenario de fallo:** Si el casillero tiene estado `Occupied`, el sistema debe impedir la modificación y mostrar: *"No se puede inhabilitar un casillero en uso. Solicite su liberación primero."*

#### Historia de Usuario 4: Rehabilitación Operativa (Actualización a "Available")
**Como** administrador del club, **quiero** restaurar el estado de un casillero que estaba en reparación **para** que vuelva a formar parte del inventario activo y los socios puedan reservarlo.

- **Escenario de éxito:** Al seleccionar un casillero en estado `Maintenance` y confirmar su habilitación, el sistema actualiza su estado a `Available`, volviendo a mostrarlo en la grilla de los socios.
- **Escenario de fallo:** Si la base de datos no puede procesar la actualización, el sistema debe realizar un `rollback`, mantener el estado en `Maintenance` y notificar el error del servidor.

### 1.4. Criterios Generales

1. Un casillero con estado `Occupied` no puede ser modificado a `Maintenance` bajo ninguna circunstancia.
2. Un casillero con estado `Maintenance` no puede ser reservado por un socio.
3. La liberación de un casillero debe ser atómica: `member_id` pasa a `null` y `status` vuelve a `Available` en la misma transacción.
4. Solo un administrador puede modificar el estado operativo (`Available` ↔ `Maintenance`).
5. Un socio solo puede liberar el casillero que tiene asignado a su nombre (validado por token de sesión).
6. Las transiciones de estado no permitidas deben ser rechazadas con un mensaje de error descriptivo.

## 2. Diseño Técnico

### 2.1. Modelo de Dominio

Se definirá la entidad **Locker** con las siguientes propiedades y restricciones:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único universal generado por el sistema |
| `number` | int | Identificador numérico del locker en el club. |
| `location` | string | Ubicación del locker. Editable |
| `status` | enum | Estado del locker: `Available`, `Occupied`, `Maintenance` |
| `member_id` | UUID / NULL | Identificador del socio que reserva el locker. Permite NULL |

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Reservar Casillero
**Método:** `PATCH /api/v1/lockers/{id}/reserve`

**Request Body** (`ReserveLockerDto`):
```typescript
{
  member_id: string; // UUID del socio que realiza la reserva
}
```

**Response** (`200 OK`):
```typescript
{
  id: string;
  number: int;
  location: string;
  status: enum;      // cambia de 'Available' a 'Occupied'
  member_id: string; // UUID del socio asignado
}
```

#### Endpoint: Liberar Casillero
**Método:** `PATCH /api/v1/lockers/{id}/release`

**Request Body:**
```typescript
// No requiere body. El socio se infiere por token de sesión.
```

**Response** (`200 OK`):
```typescript
{
  id: string;
  number: int;
  location: string;
  status: enum;      // cambia a 'Available'
  member_id: null;   // se vacía la asignación del socio
}
```

#### Endpoint: Actualizar Estado del Casillero
**Método:** `PATCH /api/v1/lockers/{id}/status`

**Request Body** (`UpdateLockerStatusDto`):
```typescript
{
  status: enum; // 'Available' o 'Maintenance'. No puede ser 'Occupied'
}
```

**Response** (`200 OK`):
```typescript
{
  id: string;
  number: int;
  location: string;
  status: enum;    // nuevo estado aplicado
  member_id: null;
}
```

#### Endpoint: Consultar Casilleros
**Método:** `GET /api/v1/lockers`

**Query Parameters:**
```typescript
{
  status?: enum; // opcional, para filtrar (ej. ?status=Available)
}
```

**Response** (`200 OK`):
```typescript
[
  {
    id: string;
    number: int;
    location: string;
    status: enum;
    member_id: string | null;
  }
]
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
  deleteById(id: string): Promise<void>;
}
```
### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `Alta de Reserva` (ReserveLocker)

**Flujo paso a paso:**

1. 
  - validar la existencia del casillero a reservar
  - validar que el estado del casillero sea estrictamente `Available`

2. 
  - mapear el `member_id` recibido en el DTO en la entidad asociada al casillero
  - mapear el cambio de estado a `Occupied`

3. 
  - persistir el mapeo de dichos datos, a través de `LockerRepository.update()`

4. 
  - retornar el DTO de respuesta mapeado desde la entidad persistida actualizada


**Caso de Uso:** `Baja de Reserva` (ReleaseLocker)

**Flujo paso a paso:**

1. 
  - validar la existencia del casillero a liberar
  - validar que el estado del casillero sea `Occupied`
  - validar que el `member_id` del casillero coincida con el id del socio en sesión para autorizar la acción

2. 
  - mapear la limpieza de datos en la entidad asociada (cambiar estado a `Available` y `member_id` a `null`)

3. 
  - persistir el mapeo de dichos datos de forma atómica, a través de `LockerRepository.update()`

4. 
  - retornar el DTO de respuesta mapeado desde la entidad persistida actualizada


**Caso de Uso:** `Actualización de Estado` (UpdateLockerStatus)

**Flujo paso a paso:**

1. 
  - validar la existencia del casillero a modificar
  - validar que solo se reciba el dato `status` (`Available` o `Maintenance`) o ignorar el resto de datos

2. 
  - validar que el estado actual del casillero no sea `Occupied` para prevenir bloqueos de casilleros en uso

3. 
  - mapear los datos del DTO recibido en la entidad asociada al casillero que se espera modificar

4. 
  - persistir el mapeo de dichos datos, a través de `LockerRepository.update()`

5. 
  - retornar el DTO de respuesta mapeado desde la entidad persistida actualizada

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|---|---|---|
| **Recurso Inexistente** | El `id` del casillero enviado en la ruta no existe en la base de datos | `404` |
| **Reserva Bloqueada** | Un socio intenta reservar un casillero con estado `Occupied` | `409` |
| **Bloqueo por Mantenimiento** | Un socio intenta reservar un casillero con estado `Maintenance` | `409` |
| **Mantenimiento Bloqueado** | Un administrador intenta pasar a `Maintenance` un casillero `Occupied` | `409` |
| **Liberación Denegada** | Un socio intenta liberar un casillero cuyo `member_id` no coincide con su sesión | `403` |
| **Error de Infraestructura** | Falla la transacción en la base de datos (se aplica rollback) | `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de Datos
Se deben utilizar librerías como `zod` para validar los datos de entrada en los DTOs (`ReserveLockerDto`, `UpdateLockerStatusDto`). Es fundamental asegurar que los valores de `status` coincidan estrictamente con el enum (`Available`, `Occupied`, `Maintenance`) y que los identificadores (`id`, `member_id`) cumplan con el formato UUID.

### 5.2. Consideraciones de Negocio
- El campo `number` jamás debe exponerse ni procesarse en la lógica de actualización.
- Las transiciones de estado deben ser controladas: un casillero no puede reservarse si su estado es `Maintenance`.
- La liberación de un casillero debe ser atómica: `member_id` pasa a `null` y `status` vuelve a `Available` en la misma transacción.

### 5.3. Consideraciones de Seguridad
- El endpoint `PATCH /api/v1/lockers/{id}/status` debe estar restringido exclusivamente a usuarios con rol administrativo.
- Los endpoints de reserva y liberación deben validar mediante JWT que el socio que ejecuta la petición es realmente quien realiza la acción, previniendo suplantaciones en el body del request.

### 5.4. Posibles Mejoras Futuras
- **Historial de Uso y Auditoría:** Implementar una tabla de auditoría relacional para registrar cada transición de estado, guardando qué socio ocupó cada locker (con fechas de inicio y fin) y qué administrador ejecutó los bloqueos de mantenimiento.
- **Liberación Automática:** Agregar una tarea programada que libere automáticamente todos los casilleros en estado `Occupied` al finalizar el horario de cierre del club.
- **Actualización en Tiempo Real:** Implementar WebSockets (ej. Socket.io) para notificar al frontend cada cambio de estado, permitiendo que la interfaz se actualice visualmente en tiempo real sin necesidad de recargar la pantalla.

## 6. Componentes de Arquitectura Hexagonal

- **Domain:** Entidad `Locker` y reglas de negocio asociadas a las transiciones de estado: un casillero `Occupied` no puede pasar a `Maintenance`, un casillero `Maintenance` no puede ser reservado, y la liberación debe limpiar `member_id` y restaurar `status` en la misma operación.

- **Application:** Casos de uso `ReserveLockerUseCase`, `ReleaseLockerUseCase` y `UpdateLockerStatusUseCase`, cada uno encargado de validar las precondiciones de negocio y delegar la persistencia al repositorio.

- **Infrastructure:** Controladores HTTP para `PATCH /api/v1/lockers/{id}/reserve`, `PATCH /api/v1/lockers/{id}/release` y `PATCH /api/v1/lockers/{id}/status` en Fastify, y repositorio de casilleros implementado con Prisma.

## 7. Plan de Implementación

1. Definir las reglas de transición de estado en la entidad `Locker` del dominio.
2. Implementar `ReserveLockerUseCase` con validación de disponibilidad y asignación de `member_id`.
3. Implementar `ReleaseLockerUseCase` con validación de propiedad por token de sesión y liberación atómica.
4. Implementar `UpdateLockerStatusUseCase` con validación de rol administrativo y restricción sobre casilleros `Occupied`.
5. Implementar los métodos necesarios.
6. Registrar las rutas `PATCH`  con validación `zod` y middlewares de autenticación y autorización correspondientes.
7. Verificar el flujo completo con un cliente HTTP cubriendo todos los escenarios de éxito y fallo definidos.
