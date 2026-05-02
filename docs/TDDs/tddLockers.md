| identifiacion | 1 |
| estado | Propuesto |
| autor | Brenda Belen Conti |
| fechas | 2026-05-02 |
| titulo | Gestion de Locker | 

# TDD-01: Gestión de Locker
## 1. Contexto de Negocio

### 1.1. Objetivo

Administrar de forma integral el inventario y la asignación de casilleros del Club Alentapp. El sistema debe permitir a los administradores registrar nuevos casilleros y monitorear su disponibilidad en tiempo real, garantizando que cada unidad se encuentre en condiciones óptimas de uso y cumpliendo con las restricciones de unicidad de identificación.

### 1.2. User Personas

**Socio**: Este usuario busca comodidad y seguridad para sus pertenencias mientras utiliza las instalaciones del club. Al interactuar con esta funcionalidad, espera poder visualizar rápidamente qué casilleros están disponibles, reservar uno de forma ágil desde su dispositivo, y liberarlo fácilmente una vez que finaliza su actividad deportiva. Valora que el sistema le confirme de manera clara cuál es el locker que tiene asignado.

**Administrativo**: Este usuario es responsable de mantener el orden y la disponibilidad de la infraestructura del club. Al interactuar con esta funcionalidad, espera tener un control total e inmediato sobre el inventario de casilleros. Busca poder registrar nuevas unidades físicas en el sistema, dar de baja aquellas que se retiren, y gestionar rápidamente los bloqueos temporales (estado de mantenimiento) para evitar que los socios intenten reservar casilleros que estén rotos o inhabilitados.

### 1.3. Criterios de Aceptación

#### Historia de Usuario 1: Alta reserva
- **Como** socio, **quiero** realizar la reserva de un locker **para** poder dejar mis pertenecias seguras mientras permanezco en el club.
- **Escenario de éxito:** Dado que el socio selecciona un casillero con estado "Disponible", el sistema debe confirmar la reserva y cambiar el estado a "Ocupado".
- **Escenario de fallo:** Si el casillero tiene estado "Ocupado" o "En Mantenimiento" el sistema debe impedir la reserva y mostrar un mensaje de error "Este casillero no está disponible".

#### Historia de Usuario 2: Validación de Identificación Única de Lockers
**Como** administrador del club, **quiero** que el sistema valide que el número de cada casillero sea único **para** evitar confusiones en las asignaciones y errores en la base de datos.  

- **Escenario de éxito:** Al registrar un nuevo locker con un número que no existe en el sistema, la operación se completa con éxito.  

- **Escenario de fallo:** Si se intenta registrar o editar un locker con un número que ya pertenece a otro casillero existente, el sistema debe impedir la acción y mostrar un mensaje de error (ej: "El número de casillero ya se encuentra registrado").  

#### Historia de Usuario 3: Liberacion de Casillero
**Como** socio, **quiero** finalizar mi reserva **para** que el casillero quede disponible para otros usuarios.

- **Escenario de éxito:** Al confirmar la finalización, el estado del locker en la base de datos debe volver a "Disponible" de forma inmediata.  
- **Escenario de fallo:** Si al intentar liberar el locker ocurre un error en el servidor o en la base de datos, el sistema debe informar que la liberación no se pudo concretar y mantener el estado anterior para evitar que el locker quede libre sin registro.

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
#### Endpoint: Reservar Casillero
**Método:** `PATCH /api/v1/lockers/{id}/reserve`
Request Body `(ReserveLockerDto)`:

```typescript
{
    member_id: string;           // UUID del socio que realiza la reserva
}
```
**Respose** (`200 Ok`):
```typescript
{
    id: string;
    number: int;
    location: string;
    status: enum;             // cambia de 'Available' a 'Occupied'
    member_id: string;           // UUID del socio asignado
}

```
#### Endpoint: Liberar Casillero
**Método:** `PATCH /api/v1/lockers/{id}/release`
Request Body `EmptyDto`:

**Respose** (`200 Ok`):
```typescript
{
    id: string;
    number: int;
    location: string;
    status: enum;             // cambia a 'Available'
    member_id: null;             // se vacía la asignación del socio
}
```

#### Endpoint: Actualizar Estado del Casillero (Mantenimiento)
**Método:** `PATCH /api/v1/lockers/{id}/status`
Request Body `(UpdateLockerStatusDto)`:

```typescript
{
    status: enum;             // 'Available' o 'Maintenance'. No puede ser 'Occupied'
}
```

**Respose** (`200 Ok`):
```typescript
{
    id: string;
    number: int;
    location: string;
    status: enum;             // cambia a 'Available'
    member_id: null;             // se vacía la asignación del socio
}
```

#### Endpoint: Consultar Casilleros
**Método:** `GET /api/v1/lockers`
Request Body `QueryParameters`:

```typescript
{
    status?: enum;            // opcional, para filtrar (ej. ?status=Available)
}
```

**Respose** (`200 Ok`):
```typescript
[                             // devuelve un array de objetos Locker
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

### 6. Especificación de Casos de Uso

#### Caso de Uso: CU-01 Alta de Reserva de Casillero
**Descripción:** Permite a un socio registrado reservar un casillero disponible en el club para resguardar sus pertenencias.
**Actor Principal:** Socio

**Precondiciones:**
1. El socio debe estar autenticado en el sistema (sesión activa).
2. El casillero seleccionado debe existir en la base de datos y su campo `status` debe ser estrictamente "Available".

**Flujo Principal (Escenario de Éxito):**
1. El socio ingresa a la sección de "Lockers" en la aplicación.
2. El sistema consulta mediante el endpoint y muestra en pantalla los casilleros disponibles.
3. El socio selecciona un casillero específico y presiona el botón "Reservar".
4. El sistema envía una petición adjuntando el ID del socio en el body.
5. El sistema valida que el casillero siga disponible.
6. El sistema actualiza el registro en la base de datos: cambia el `status` a "Occupied" y guarda el UUID del socio en el campo `member`.
7. El sistema confirma visualmente la reserva exitosa al socio y le indica el `number` y `location` del casillero.

**Flujos Alternativos (Escenarios de Fallo):**
*   **A1. Casillero en Mantenimiento:**
    En el paso 5, el sistema detecta que un administrador acaba de pasar el casillero a "Maintenance".El sistema rechaza la petición y muestra el mensaje: *"Este casillero se encuentra en mantenimiento y no puede ser reservado."*
*   **A3. Falla de Conexión:**
*  En el paso 6, ocurre una caída de red o error interno de la base de datos. El sistema aborta la transacción, asegurando que no queden datos inconsistentes, y muestra un mensaje de error genérico invitando a reintentar.

**Postcondiciones:**
*   El casillero queda inaccesible para otros socios.
*   El socio queda vinculado a ese `number` de casillero específico hasta que realice la acción de Liberación.

#### Caso de Uso: CU-02 Baja de Reserva (Liberación de Casillero)
**Descripción:** Permite a un socio desocupar y liberar el casillero que tiene asignado actualmente, dejándolo habilitado para que otros miembros del club puedan utilizarlo.
**Actor Principal:** Socio

**Precondiciones:**
1. El socio debe estar autenticado en el sistema (sesión activa).
2. El socio debe tener un casillero previamente asignado a su nombre (el `status` del casillero debe ser "Occupied" y el campo `member` debe contener el UUID del socio).

**Flujo Principal (Escenario de Éxito):**
1. El socio ingresa a la sección "Mi Casillero" (o perfil de usuario) dentro de la aplicación.
2. El sistema muestra la información del casillero actualmente reservado (`number` y `location`).
3. El socio presiona el botón "Liberar Casillero" y confirma la acción en el cuadro de diálogo.
4. El sistema envía una petición `PATCH /api/v1/lockers/{id}/release`.
5. El sistema valida por seguridad que el ID del usuario en sesión coincida exactamente con el UUID registrado en el campo `member` del casillero.
6. El sistema actualiza el registro en la base de datos: cambia el `status` a "Available" y setea el campo `member` a `null`.
7. El sistema muestra un mensaje de confirmación ("Casillero liberado exitosamente") y redirige al socio a la pantalla principal.

**Flujos Alternativos (Escenarios de Fallo):**
*   **A1. Falla de Conexión / Infraestructura:**
    *   *Condición:* En el paso 6, ocurre un error de comunicación con la base de datos, el sistema aplica un `rollback` para asegurar que los datos no queden corruptos , mantiene el casillero en estado "Occupied" y muestra: *"Ocurrió un error al intentar liberar el casillero. Por favor, intenta nuevamente en unos instantes."*

**Postcondiciones:**
*   El casillero vuelve a ser visible en el listado de lockers disponibles para todos los socios.
*   El socio queda desvinculado de ese casillero y habilitado para realizar una nueva reserva en el futuro.

#### Caso de Uso: CU-03 Actualización de Estado (Gestión de Mantenimiento)
**Descripción:** Permite a un administrador del club modificar el estado operativo de un casillero, típicamente para inhabilitarlo por reparaciones ("Maintenance") o volver a habilitarlo para su uso ("Available").
**Actor Principal:** Administrador
**Actores Secundarios:** Sistema de Base de Datos

**Precondiciones:**
1. El administrador debe estar autenticado en el sistema y contar con los permisos o el rol adecuado para la gestión de infraestructura.
2. El casillero a modificar debe existir previamente en la base de datos.

**Flujo Principal (Escenario de Éxito):**
1. El administrador ingresa al panel de "Gestión de Lockers" en el sistema.
2. El sistema muestra el inventario completo de casilleros con sus estados actuales.
3. El administrador selecciona un casillero específico (por ejemplo, uno en estado "Available") y elige la opción "Cambiar a Mantenimiento".
4. El sistema envía una petición `PATCH /api/v1/lockers/{id}/status` enviando `"status": "Maintenance"` en el body.
5. El sistema valida los permisos del usuario y verifica que el casillero no se encuentre actualmente ocupado por un socio.
6. El sistema actualiza el registro en la base de datos, cambiando el `status` al nuevo valor.
7. El sistema confirma la operación con un mensaje en pantalla ("Estado actualizado correctamente") y refresca la lista de casilleros.

**Flujos Alternativos (Escenarios de Fallo):**
*   **A1. Casillero Ocupado (Regla de Negocio):** 
    *   *Condición:* En el paso 5, el sistema detecta que el casillero tiene el estado "Occupied" y un `member` asignado. El sistema bloquea la actualización, no realiza cambios y muestra el mensaje: *"No se puede pasar a mantenimiento un casillero que actualmente está siendo utilizado por un socio. Por favor, solicite la liberación primero."*
*   **A2. Error de Permisos (Falta de autorización):**
    *   *Condición:* En el paso 5, el sistema detecta que el usuario autenticado no tiene rol de administrador.El sistema rechaza la solicitud y muestra: *"Acceso denegado: no cuenta con los permisos necesarios para realizar esta acción."*
*   **A3. Falla de Conexión / Infraestructura:**
    *   *Condición:* En el paso 6, ocurre un problema de comunicación con la base de datos.El sistema aplica un `rollback` de seguridad , mantiene el estado original del casillero y muestra un mensaje indicando que la operación no pudo concretarse debido a un error en el servidor.

**Postcondiciones:**
*   Si el casillero pasó a "Maintenance", desaparece automáticamente de la vista de casilleros disponibles para los socios, impidiendo nuevas reservas.
*   Si el casillero volvió a "Available", queda inmediatamente habilitado para que cualquier socio lo pueda reservar.

#### Caso de Uso: CU-04 Alta de Casillero
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

#### Caso de Uso: CU-05 Baja de Casillero (Eliminación)
**Descripción:** Permite a un administrador eliminar un casillero del sistema, generalmente porque la unidad física fue retirada del club, vendida o destruida y no volverá a utilizarse.
**Actor Principal:** Administrador

**Precondiciones:**
1. El administrador debe estar autenticado en el sistema y poseer los permisos necesarios para modificar la infraestructura del club.
2. El casillero a eliminar debe existir en la base de datos.
3. El casillero **no debe estar ocupado** por ningún socio (su `status` no puede ser "Occupied" ni tener un UUID en el campo `member`).

**Flujo Principal (Escenario de Éxito):**
1. El administrador ingresa al módulo de "Gestión de Lockers".
2. El sistema despliega el listado completo de casilleros.
3. El administrador selecciona el casillero que desea dar de baja y hace clic en la opción "Eliminar" (o ícono de papelera).
4. El sistema muestra una ventana de advertencia (modal) solicitando la confirmación final de la acción, aclarando que es un proceso irreversible.
5. El administrador confirma la eliminación.
6. El sistema envía una petición `DELETE /api/v1/lockers/{id}`.
7. El sistema verifica que el casillero no tenga el estado "Occupied".
8. El sistema ejecuta el borrado del registro en la base de datos relacional.
9. El sistema muestra un mensaje de éxito ("Casillero eliminado correctamente") y lo remueve de la lista visual en pantalla.

**Flujos Alternativos (Escenarios de Fallo):**
*   **A1. Casillero Ocupado:** 
    *   *Condición:* En el paso 7, el sistema detecta que el casillero tiene un socio asignado, aborta la eliminación asegurando la integridad de los datos, y muestra el mensaje: *"Operación denegada. No se puede eliminar un casillero que se encuentra actualmente en uso. Solicite su liberación primero."*
*   **A2. Casillero Inexistente:**
    *   *Condición:* En el paso 6, al buscar el ID enviado, el sistema detecta que ya no existe (por ejemplo, si otro administrador lo borró un segundo antes). El sistema frena la acción y recarga la lista de casilleros para mostrar la información actualizada.
*   **A3. Error de Permisos:**
    *   *Condición:* En el paso 6, se valida que el usuario no tiene el rol correspondiente. El sistema bloquea el request y notifica: *"Acceso denegado: no cuenta con los permisos para eliminar registros."*
*   **A4. Falla de Infraestructura (Error en BD):**
    *   *Condición:* En el paso 8, falla la ejecución de la consulta SQL.
    *   *Acción:* El sistema aborta la transacción, asegurando que no queden datos corruptos, y notifica un error interno del servidor.

**Postcondiciones:**
*   El registro del casillero desaparece permanentemente del modelo relacional.
*   El número (`number`) de ese casillero vuelve a quedar libre y podría ser utilizado para dar de alta un nuevo casillero en el futuro sin generar un conflicto de duplicidad.

#### Caso de Uso: CU-06 Cambio de Estado de Casillero (Mantenimiento)
**Descripción:** Permite a un administrador del club modificar el estado operativo de un casillero físico, pasándolo a "Maintenance" por reparaciones o devolviéndolo a "Available" una vez solucionado el problema.
**Actor Principal:** Administrador

**Precondiciones:**
1. El usuario debe estar autenticado en el sistema y contar con los permisos correspondientes al rol de administración.
2. El casillero a modificar debe existir previamente en la base de datos.

**Flujo Principal (Escenario de Éxito):**
1. El administrador ingresa a la sección de "Gestión de Lockers".
2. El sistema despliega el inventario de casilleros con sus estados actuales.
3. El administrador selecciona un casillero disponible y hace clic en la opción "Cambiar Estado".
4. El administrador selecciona el nuevo estado ("Maintenance") y confirma la acción.
5. El sistema envía una petición `PATCH /api/v1/lockers/{id}/status` con el nuevo estado en el body.
6. El sistema valida los permisos del usuario y verifica que el casillero no se encuentre actualmente en estado "Occupied".
7. El sistema actualiza el registro en la base de datos con el nuevo valor en la columna `status`.
8. El sistema muestra un mensaje de éxito ("Estado actualizado correctamente") y refresca visualmente la lista.

**Flujos Alternativos (Escenarios de Fallo):**
*   **A1. Casillero Ocupado (Regla de Negocio):** 
    *   *Condición:* En el paso 6, el sistema detecta que el casillero tiene el estado "Occupied" (tiene un `member` asignado). El sistema bloquea la actualización, no realiza cambios y muestra el mensaje: *"No se puede pasar a mantenimiento un casillero que actualmente está siendo utilizado por un socio. Aguarde a su liberación."*
*   **A2. Falla de Infraestructura:**
    *   *Condición:* Falla la actualización en la base de datos. El sistema realiza un `rollback` de seguridad y muestra un mensaje de error interno del servidor.

**Postcondiciones:**
*   Si el estado cambia a "Maintenance", el sistema automáticamente lo oculta o lo deshabilita en la vista de reservas de los socios, impidiendo su uso.
*   Si el estado cambia de vuelta a "Available", el casillero queda inmediatamente liberado y visible para nuevas reservas.

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Datos Faltantes** | los campos obligatorios (number, location) deben estar presentes en el body. | `400` | 
| **Number Duplicado** | no pueden exixtir dos casilleros con el mismo `number` | `409` |
| **Recurso Inexistente** |el id del casillero no existe en la base de datos.| `404` | 
| **Modificacion Invalida** | no se permite modificar el campo number una vez creado el casillero. | `400` |
| **Reserva Bloqueada** | no se puede reservar un casillero cuyo status sea "Maintenance" u "Occupied".| `409` |
| **Liberación Denegada** | un socio no puede liberar un casillero que no le pertenece (el member no coincide). | `403` |
| **Mantenimiento Ocupado** | no se puede pasar a "Maintenance" ni eliminar un casillero que tenga un socio activo asignado. | `409` |
| **Error de Infraestructura** | falla la conexión con la base de datos.| `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se pueden utilizar librerías como zod para validar los datos de entrada en los DTOs, asegurando que los campos requeridos estén presentes, que number sea un entero positivo, y que los valores de status coincidan estrictamente con el Enum (Available, Occupied, Maintenance).

### 5.2. Consideraciones de negocio
-El campo number no debe poder modificarse una vez creado el casillero para mantener la integridad relacional.

-Un casillero bajo ninguna circunstancia puede ser reservado si su estado actual es "Maintenance".

-Al momento de liberar un casillero, el sistema debe limpiar la asignación (member pasa a ser nulo) y devolver el estado a "Available".

### 5.3. Consideraciones de seguridad
-Los endpoints de creación (POST), modificación de mantenimiento y eliminación (DELETE / PATCH status) deben estar restringidos exclusivamente a usuarios con rol administrativo.

-Los endpoints de reserva y liberación deben validar mediante el token de sesión que el socio autenticado sea quien está realizando la acción.

### 5.4. Posibles mejoras futuras
-Implementar una tabla de auditoría (historial) para registrar qué socio utilizó cada locker, con fechas y horas de inicio y fin.

-Agregar una tarea programada que libere automáticamente los casilleros que sigan en estado "Occupied" al finalizar el horario de cierre del club.
