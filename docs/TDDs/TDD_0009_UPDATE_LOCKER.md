| identifiacion | 09 |
|---------------|---|
| estado | Propuesto |
| autor | Brenda Belen Conti |
| fechas | 2026-05-02 |
| titulo | Modificacion de Locker |

# TDD-0009: Modificacion de Locker

### 1.1. Objetivo
Asegurar la correcta actualización de los datos y el estado operativo de los casilleros en el sistema Alentapp. El proceso debe garantizar que los cambios reflejen con exactitud la realidad física de la infraestructura (como inhabilitaciones temporales por mantenimiento), previniendo estrictamente la modificación de casilleros que se encuentren en uso por un socio y protegiendo la inmutabilidad del número identificador para preservar la integridad del modelo relacional.

### 1.2. User Personas

**Administrativo**: Este usuario es responsable de mantener el orden y la disponibilidad de la infraestructura del club. Al interactuar con esta funcionalidad, espera tener un control total e inmediato sobre el inventario de casilleros. Es el único actor autorizado para auditar y gestionar los cambios de estado operativo de los lockers.

**Socio**: Este usuario busca comodidad y seguridad para sus pertenencias mientras utiliza las instalaciones del club. Al interactuar con esta funcionalidad, espera poder visualizar rápidamente qué casilleros están disponibles, reservar uno de forma ágil desde su dispositivo, y liberarlo fácilmente una vez que finaliza su actividad deportiva. Valora que el sistema le confirme de manera clara cuál es el locker que tiene asignado.

#### Historia de Usuario 1: Alta de Reserva (Actualización a "Ocupado")
**Como** socio del club, **quiero** poder reservar un casillero específico **para** resguardar mis pertenencias de forma segura mientras utilizo las instalaciones.

- **Escenario de éxito:** Al seleccionar un casillero con estado "Available", el sistema asigna mi identificador (`member_id`) al casillero y actualiza su estado a "Occupied" de forma inmediata, confirmando la reserva.
- **Escenario de fallo:** Si intento reservar un casillero que, en el transcurso de mi operación, cambió a estado "Occupied" por otro socio o a "Maintenance" por un administrador, el sistema debe impedir la actualización y mostrar un error: *"Este casillero ya no se encuentra disponible."*

#### Historia de Usuario 2: Baja de Reserva (Actualización a "Disponible")
**Como** socio del club, **quiero** finalizar mi reserva **para** liberar mis pertenencias y que el casillero quede habilitado para otros usuarios.

- **Escenario de éxito:** Al confirmar la finalización desde mi perfil, el sistema elimina mi identificador (`member_id` pasa a `null`) y actualiza el estado del casillero a "Available" de forma inmediata.
- **Escenario de fallo:** Si intento liberar un casillero que no me pertenece (el `member_id` no coincide con mi sesión) o si ocurre un error de red, el sistema debe abortar la actualización, mantener el estado "Occupied" y mi asignación para evitar inconsistencias, informando del fallo.

#### Historia de Usuario 3: Bloqueo por Mantenimiento (Actualización a "Mantenimiento")
**Como** administrador del club, **quiero** modificar el estado de un casillero a mantenimiento **para** inhabilitar su uso en caso de roturas, limpieza profunda o fallas en la cerradura.

- **Escenario de éxito:** Al seleccionar un casillero en estado "Available", el sistema actualiza su estado a "Maintenance", ocultándolo o bloqueándolo en la vista de los socios para futuras reservas.
- **Escenario de fallo:** Si intento pasar a mantenimiento un casillero que actualmente tiene estado "Occupied" (tiene un socio asignado), el sistema debe impedir la modificación por regla de negocio y mostrar un error: *"No se puede inhabilitar un casillero en uso. Solicite su liberación primero."*

#### Historia de Usuario 4: Rehabilitación Operativa (Actualización a "Disponible")
**Como** administrador del club, **quiero** restaurar el estado de un casillero que estaba en reparación **para** que vuelva a formar parte del inventario activo y los socios puedan reservarlo.

- **Escenario de éxito:** Al seleccionar un casillero en estado "Maintenance" y confirmar su habilitación, el sistema actualiza su estado a "Available", volviendo a mostrarlo en la grilla de los socios.
- **Escenario de fallo:** Si la base de datos no puede procesar la actualización debido a un problema de infraestructura, el sistema debe realizar un `rollback`, mantener el estado en "Maintenance" y notificarme del error del servidor.

### 2.1. Modelo de Dominio
Se definirá la entidad **Locker** con las siguientes propiedades y restricciones:

- **id**: identificador único universal (UUID) generado por el sistema
- **number**: int. Identificador numerico del locker en el club.
- **location**: string. Ubicacion del locker.
- **status**: string. Posibles estados del locker (Available, Occupied, Maintenance)
- **member_ID**: identificador único universal (UUID). Permite NULL. Identificador del socio que reserva el locker.


### 2.2. Contrato de API (Shared DTOs)
Definiremos los tipos en el paquete compartido para asegurar la gestión de los cambios de estado:

#### Endpoint: Reservar Casillero
**Método:** `PATCH /api/v1/lockers/{id}/reserve`
**Request Body** (`ReserveLockerDto`):
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
{
// No requiere body, el socio se infiere por token de sesión o reglas de negocio
}

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

#### Caso de Uso: CU-01 Actualización de Estado (Gestión de Mantenimiento)
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

#### Caso de Uso: CU-02 Cambio de Estado de Casillero (Mantenimiento)
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

#### Caso de Uso: CU-03 Alta de Reserva de Casillero
**Descripción:** Permite a un socio registrado reservar un casillero disponible en el club para resguardar sus pertenencias de forma segura mientras utiliza las instalaciones.
**Actor Principal:** Socio

**Precondiciones:**
1. El socio debe estar autenticado en el sistema (sesión activa).
2. El casillero seleccionado debe existir en la base de datos y su campo `status` debe ser estrictamente "Available".

**Flujo Principal (Escenario de Éxito):**
1. El socio ingresa a la sección de "Lockers" en la aplicación móvil o web.
2. El sistema despliega visualmente los casilleros que se encuentran disponibles.
3. El socio selecciona un casillero específico y presiona el botón "Reservar".
4. El sistema envía una petición `PATCH /api/v1/lockers/{id}/reserve` adjuntando el ID del socio (`member_id`) en el body.
5. El sistema valida la sesión del usuario y verifica en tiempo real que el casillero siga en estado "Available".
6. El sistema actualiza el registro en la base de datos: cambia el `status` a "Occupied" y guarda el UUID del socio en el campo `member_id`.
7. El sistema confirma visualmente la reserva exitosa al socio y le indica el número y ubicación del casillero asignado.

**Flujos Alternativos (Escenarios de Fallo):**
*   **A1. Casillero No Disponible (Condición de Carrera):**
    *   *Condición:* En el paso 5, el sistema detecta que un administrador acaba de pasarlo a "Maintenance" u otro socio lo reservó milisegundos antes. El sistema frena la actualización, no realiza cambios y muestra el mensaje: *"Este casillero ya no se encuentra disponible. Por favor, seleccione otro."*
*   **A2. Falla de Infraestructura:**
    *   *Condición:* En el paso 6, ocurre una caída de red o error interno de la base de datos. El sistema aborta la transacción, asegurando que no queden datos inconsistentes, y muestra un mensaje de error genérico invitando a reintentar.

**Postcondiciones:**
*   El casillero queda inaccesible para otros socios (desaparece de la grilla de disponibles).
*   El socio queda vinculado a ese número de casillero específico hasta que ejecute la acción de liberación.

---

#### Caso de Uso: CU-04 Baja de Reserva (Liberación de Casillero)
**Descripción:** Permite a un socio desocupar y liberar el casillero que tiene asignado actualmente, dejándolo habilitado en el sistema para que otros miembros del club puedan utilizarlo.
**Actor Principal:** Socio

**Precondiciones:**
1. El socio debe estar autenticado en el sistema (sesión activa).
2. El socio debe tener un casillero previamente asignado a su nombre (el `status` del casillero debe ser "Occupied" y el campo `member_id` debe contener exactamente el UUID de este socio).

**Flujo Principal (Escenario de Éxito):**
1. El socio ingresa a la sección "Mi Casillero" (o perfil de usuario) dentro de la aplicación.
2. El sistema muestra la información del casillero actualmente reservado.
3. El socio presiona el botón "Liberar Casillero" y confirma la acción en el cuadro de diálogo.
4. El sistema envía una petición `PATCH /api/v1/lockers/{id}/release`.
5. El sistema valida por seguridad que el ID del usuario en sesión coincida con el UUID registrado en el campo `member_id` del casillero.
6. El sistema actualiza el registro en la base de datos: cambia el `status` a "Available" y setea el campo `member_id` a `null`.
7. El sistema muestra un mensaje de confirmación ("Casillero liberado exitosamente") y redirige al socio a la pantalla principal.

**Flujos Alternativos (Escenarios de Fallo):**
*   **A1. Error de Autorización (Asignación Incorrecta):**
    *   *Condición:* En el paso 5, el sistema detecta que el `member_id` de la base de datos no coincide con el token de sesión del usuario que intenta liberarlo. El sistema bloquea el request con un `403 Forbidden` y muestra: *"Acceso denegado: no puedes liberar un casillero que no tienes asignado."*
*   **A2. Falla de Conexión / Infraestructura:**
    *   *Condición:* En el paso 6, ocurre un error de comunicación con la base de datos. El sistema aplica un `rollback` de seguridad, mantiene el casillero en estado "Occupied" y el `member_id` intacto, y muestra: *"Ocurrió un error al intentar liberar el casillero. Por favor, intenta nuevamente en unos instantes."*

**Postcondiciones:**
*   El estado del casillero vuelve a "Available" y el `member_id` queda limpio (`null`).
*   El casillero vuelve a ser visible en el listado general para todos los socios.
*   El socio queda desvinculado de ese casillero y habilitado para realizar una nueva reserva en el futuro.

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Recurso Inexistente** | El `id` del casillero enviado en la ruta de actualización no existe en la base de datos. | `404` | 
| **Reserva Bloqueada** | Un socio intenta reservar un casillero cuyo estado actual es "Occupied". | `409` |
| **Liberación Denegada** | Un socio intenta liberar un casillero que no le pertenece (el `member_id` registrado no coincide con el de su sesión). | `403` |
| **Mantenimiento Bloqueado** | Un administrador intenta pasar a "Maintenance" un casillero que actualmente se encuentra "Occupied" por un socio. | `409` |
| **Error de Infraestructura** | Falla la transacción en la base de datos al intentar aplicar la actualización (se debe realizar un rollback). | `500` |
| **Bloqueo por Mantenimiento** | Un socio intenta reservar un casillero cuyo estado actual es "Maintenance". El sistema debe rechazar la operación inmediatamente. | `409` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se deben utilizar librerías como Zod para validar los datos de entrada en los respectivos DTOs (`ReserveLockerDto`, `UpdateLockerStatusDto`). Es fundamental asegurar que los valores de estado coincidan estrictamente con (`Available`, `Occupied`, `Maintenance`) y que los identificadores (`id` y `member_id`) cumplan con el formato UUID antes de procesar la lógica de negocio.

### 5.2. Consideraciones de negocio
- El campo `number` jamás debe exponerse ni procesarse en la lógica de actualización, garantizando así la integridad relacional del modelo.
- Las transiciones de estado deben ser controladas: un casillero bajo ninguna circunstancia puede ser reservado si su estado actual es "Maintenance".
- La operación de liberación de un casillero debe ser atómica: el sistema tiene la obligación de limpiar la asignación (`member_id` pasa a `null`) y devolver el estado a "Available" en la misma transacción.

### 5.3. Consideraciones de seguridad
- El endpoint de modificación de estado operativo (`PATCH /api/v1/lockers/{id}/status`) debe estar restringido exclusivamente a usuarios autenticados con rol administrativo.
- Los endpoints de reserva y liberación deben validar mediante el token de sesión (JWT) que el socio que está ejecutando la petición es realmente quien está realizando la acción, previniendo suplantaciones en el body de la request.

### 5.4. Posibles mejoras futuras
- **Historial de Uso y Auditoría:** Implementar una tabla de auditoría relacional para registrar cada transición de estado, guardando qué socio ocupó cada locker (con fechas y horas de inicio y fin) y qué administrador ejecutó los bloqueos de mantenimiento.
- **Liberación Automátic:** Agregar una tarea programada que ejecute un script en la base de datos para liberar automáticamente todos los casilleros que sigan en estado "Occupied" al finalizar el horario de cierre del club.
- **Actualización en Tiempo Real:** Implementar WebSockets (ej. Socket.io) para notificar al frontend cada vez que un casillero cambia de estado, permitiendo que la interfaz se actualice visualmente en tiempo real para todos los usuarios conectados sin necesidad de recargar la pantalla.
