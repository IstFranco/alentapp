| identifiacion | 07 |
|---------------|---|
| estado | Propuesto |
| autor | Brenda Belen Conti |
| fechas | 2026-05-02 |
| titulo | Registro de nuevo Locker |

# TDD-0007: Registro de nuevo Locker

## 1. Contexto de Negocio

### 1.1. Objetivo
Asegurar la correcta creación de casilleros en el sistema Alentapp, garantizando la **unicidad del identificador numérico** y la integridad de los estados iniciales.

### 1.2. User Personas

**Administrativo**: Este usuario es responsable de mantener el orden y la disponibilidad de la infraestructura del club. Al interactuar con esta funcionalidad, espera tener un control total e inmediato sobre el inventario de casilleros. Busca poder registrar nuevas unidades físicas en el sistema.

### 1.3. Criterios de Aceptación

#### Historia de Usuario 1: Alta de Nuevo Locker
**Como** administrador del club, **quiero** registrar un nuevo casillero físico en el sistema **para** ampliar el inventario disponible y que los socios puedan utilizarlo.

**Escenario de éxito:** Al ingresar los datos requeridos con un número de casillero inédito, el sistema lo registra exitosamente y le asigna el estado "Disponible" por defecto.

**Escenario de fallo:** Si se intenta registrar un casillero con un número que ya existe en la base de datos, el sistema debe bloquear la operación para mantener la integridad relacional y mostrar un mensaje de error indicando que el número ya está en uso.

#### Historia de Usuario 2: Validación de Identificación Única de Lockers
**Como** administrador del club, **quiero** que el sistema valide que el número de cada casillero sea único **para** evitar confusiones en las asignaciones y errores en la base de datos.  

- **Escenario de éxito:** Al registrar un nuevo locker con un número que no existe en el sistema, la operación se completa con éxito.  

- **Escenario de fallo:** Si se intenta registrar o editar un locker con un número que ya pertenece a otro casillero existente, el sistema debe impedir la acción y mostrar un mensaje de error (ej: "El número de casillero ya se encuentra registrado").  

## 2. Diseño Técnico

### 2.1. Modelo de Dominio
Se definirá la entidad **Locker** con las siguientes propiedades y restricciones:

- **id**: identificador único universal (UUID) generado por el sistema
- **number**: int. Identificador numerico del locker en el club.
- **location**: string. Ubicacion del locker.
- **status**: string. Posibles estados del locker (Available, Occupied, Maintenance)
- **member_ID**: identificador único universal (UUID). Permite NULL. Identificador del socio que reserva el locker.

### 2.2. Contrato de API (Shared DTOs)
Definiremos los tipos en el paquete compartido para asegurar la gestion:

#### Endpoint: Crear Casillero
**Método:** `POST /api/v1/lockers`

**Request Body** (`CreateLockerDto`):
```typescript
{
    number: int;              // inmutable luego de la creación, debe ser único
    location: string;         // editable
}
```
**Respose** (`201 Created`):
```typescript
{
    id: string;               // UUID generado por el sistema
    number: int;              // identificador numérico único
    location: string;         // ubicación del casillero
    status: enum;             // por defecto se crea en 'Available'
    member_id: string | null;    // por defecto se inicializa en null
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
  create(locker: Locker) 
}
```

### 3.2. Lógica del Caso de Uso

### Especificación de Casos de Uso
#### Caso de Uso: CU-01 Alta de Casillero
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
7. El sistema crea el registro en la base de datos, generando un nuevo `id` (UUID) y asignando automáticamente el `status` inicial como "Available" y el `member` en `null`.
8. El sistema muestra un mensaje de éxito ("Casillero registrado correctamente") y actualiza el listado en pantalla.

**Flujos Alternativos (Escenarios de Fallo):**
*   **A1. Número de Casillero Duplicado (Regla de Negocio):** 
    *   *Condición:* En el paso 6, el sistema detecta que el `number` ingresado ya pertenece a otro casillero existente, el sistema rechaza la creación, no guarda nada en la base de datos y muestra el mensaje: *"Error: El número de casillero ingresado ya existe. Por favor, asigne un identificador único."*
*   **A2. Error de Permisos:**
    *   *Condición:* En el paso 5, el sistema verifica que el usuario autenticado no tiene rol de administrador. El sistema deniega la solicitud y muestra: *"Acceso denegado: no cuenta con los permisos necesarios para registrar nuevos casilleros."*
*   **A3. Falla de Conexión / Infraestructura:**
    *   *Condición:* En el paso 7, ocurre un problema al intentar insertar el registro en la base de datos. El sistema aborta la operación y muestra un mensaje indicando que ocurrió un error interno en el servidor.

**Postcondiciones:**
*   El nuevo casillero se incorpora a la base de datos y al listado general.
*   El casillero queda inmediatamente disponible ("Available") para que cualquier socio lo pueda reservar.


## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Datos Faltantes** | los campos obligatorios (number, location) deben estar presentes en el body. | `400` | 
| **Number Duplicado** | no pueden exixtir dos casilleros con el mismo `number` | `409` |
| **Error de Infraestructura** | falla la conexión con la base de datos.| `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se pueden utilizar librerías como zod para validar los datos de entrada en los DTOs, asegurando que los campos requeridos estén presentes, que number sea un entero positivo, y que los valores de status coincidan estrictamente con el Enum (Available, Occupied, Maintenance).

### 5.2. Consideraciones de negocio
-El campo number no debe poder modificarse una vez creado el casillero para mantener la integridad relacional.

### 5.3. Consideraciones de seguridad
-Los endpoints de creación deben estar restringidos exclusivamente a usuarios con rol administrativo.

### 5.4. Posibles mejoras futuras
- **Creación en Lote (Bulk Insert):** Implementar un nuevo endpoint (ej. `POST /api/v1/lockers/bulk`) que permita a los administradores registrar múltiples casilleros simultáneamente ingresando un rango (por ejemplo, del locker 1 al 50). Esto optimizaría drásticamente el tiempo de configuración inicial de la infraestructura del club.
- **Trazabilidad en la Arquitectura Relacional:** Incorporar campos de auditoría en el modelo relacional de la base de datos (`created_at`, `updated_at`, `created_by_admin_id`). Esto permitirá llevar un control estricto sobre qué usuario administrativo específico dio de alta cada unidad física y en qué momento exacto.
- **Categorización por Tamaño:** Ampliar el modelo de dominio para incluir un nuevo atributo que defina las dimensiones del locker (ej: `size: 'Small' | 'Medium' | 'Large'`). Esto enriquecería los filtros de búsqueda en el futuro.
- **Integración Visual (Mejora de UX/UI):** Evolucionar el campo de texto libre `location` hacia un sistema de coordenadas o sectores predefinidos. Esto permitiría al frontend renderizar un mapa interactivo o una grilla visual del club, mejorando significativamente la experiencia tanto de los socios al buscar su locker, como de los administradores al gestionar el inventario.
- **Generación Automática de Códigos QR:** Desarrollar un servicio que, tras la creación exitosa del registro, genere un código QR único vinculado al UUID del locker. Este código podría imprimirse y pegarse en el casillero físico para facilitar su identificación o permitir una futura apertura escaneándolo desde la aplicación.
