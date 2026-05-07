# TDD-0008: Baja de Locker

| Identificación | 08 |
|---|---|
| Estado | Propuesto |
| Autor | Brenda Belen Conti |
| Fecha | 2026-05-07|

## 1. Contexto de Negocio

### 1.1. Objetivo
Asegurar la correcta eliminación de casilleros en el sistema Alentapp, garantizando la integridad del modelo relacional al **impedir estrictamente el borrado de unidades que se encuentren actualmente ocupadas** por un socio.

### 1.2. User Persona

**Administrativo:** Este usuario es responsable de mantener el orden y la disponibilidad de la infraestructura del club. Al interactuar con esta funcionalidad, espera tener un control total e inmediato sobre el inventario de casilleros. Busca poder dar de baja aquellas unidades que se retiren.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Baja de Locker (Eliminación)
**Como** administrador del club, **quiero** dar de baja y eliminar un casillero del sistema **para** mantener el inventario de la base de datos actualizado cuando una unidad física es retirada definitivamente de las instalaciones.

- **Escenario de éxito:** Al confirmar la eliminación de un casillero que no se encuentra en uso, el sistema lo borra exitosamente del modelo relacional y libera su número de identificación.
- **Escenario de fallo:** Si se intenta eliminar un casillero que actualmente se encuentra ocupado por un socio (estado `Occupied`), el sistema debe bloquear la operación y mostrar un mensaje de error advirtiendo que no se puede eliminar un casillero en uso.


### 1.4. Criterios Generales

1. Un casillero con estado `Occupied` no puede ser eliminado bajo ninguna circunstancia.
2. Un casillero con estado `Maintenance` puede ser eliminado, asumiendo que la unidad física fue retirada del club.
3. El casillero a eliminar debe existir en la base de datos.
4. Solo usuarios con rol administrativo pueden dar de baja casilleros.
5. El parámetro `{id}` de la URL debe tener formato UUID válido.
6. La eliminación es irreversible y debe requerir confirmación explícita del administrador.
7. Al eliminar un casillero, su `number` queda libre y puede reutilizarse en el futuro sin conflicto de unicidad.


## 2. Diseño Técnico

### 2.1. Modelo de Dominio

Se definirá la entidad **Locker** con las siguientes propiedades y restricciones:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único universal generado por el sistema |
| `number` | int | Identificador numérico del locker en el club |
| `location` | string | Ubicación del locker |
| `status` | enum | Estado del locker: `Available`, `Occupied`, `Maintenance` |
| `member_id` | UUID / NULL | Identificador del socio que reserva el locker. Permite NULL |

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Baja de Locker

**Método:** `DELETE /api/v1/lockers/{id}`

**Request Body:**
```typescript
// No se requiere body. El ID del casillero a eliminar viaja como parámetro en la URL.
```

**Response** (`200 OK`):
```typescript
{
  message: string; // ej. "Casillero eliminado correctamente"
  id: string;      // UUID del casillero que fue dado de baja
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
  deleteById(id: string): Promise<void>;
}
```

### 3.2. Lógica del Caso de Uso

#### CU-01: Baja de Locker

**Descripción:** Permite a un administrador eliminar un casillero del sistema, generalmente porque la unidad física fue retirada del club, vendida o destruida y no volverá a utilizarse.

**Actor Principal:** Administrador

**Precondiciones:**
1. El administrador debe estar autenticado con los permisos necesarios para modificar la infraestructura del club.
2. El casillero a eliminar debe existir en la base de datos.
3. El casillero no debe estar ocupado por ningún socio (`status` distinto de `Occupied` y `member_id` en `null`).

**Flujo Principal (Escenario de Éxito):**
1. El administrador ingresa al módulo de "Gestión de Lockers".
2. El sistema despliega el listado completo de casilleros.
3. El administrador selecciona el casillero a dar de baja y hace clic en "Eliminar".
4. El sistema muestra un modal de confirmación advirtiendo que la acción es irreversible.
5. El administrador confirma la eliminación.
6. El sistema envía una petición `DELETE /api/v1/lockers/{id}`.
7. El sistema verifica que el casillero no tenga el estado `Occupied`.
8. El sistema ejecuta el borrado del registro en la base de datos.
9. El sistema muestra un mensaje de éxito ("Casillero eliminado correctamente") y lo remueve del listado en pantalla.

**Flujos Alternativos (Escenarios de Fallo):**

- **A1. Casillero Ocupado:** En el paso 7, el sistema detecta que el casillero tiene un socio asignado. Aborta la eliminación y muestra: *"Operación denegada. No se puede eliminar un casillero que se encuentra actualmente en uso. Solicite su liberación primero."*
- **A2. Casillero Inexistente:** En el paso 6, el sistema no encuentra el ID enviado. Frena la acción y recarga la lista de casilleros con la información actualizada.
- **A3. Error de Permisos:** En el paso 6, se valida que el usuario no tiene el rol correspondiente. El sistema bloquea el request y notifica: *"Acceso denegado: no cuenta con los permisos para eliminar registros."*
- **A4. Falla de Infraestructura:** En el paso 8, falla la ejecución de la consulta SQL. El sistema aborta la transacción y notifica un error interno del servidor.

**Postcondiciones:**
- El registro del casillero desaparece permanentemente del modelo relacional.
- El `number` de ese casillero queda libre y puede ser reutilizado en el futuro sin conflicto de unicidad.

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|---|---|---|
| **Casillero Ocupado** | No se puede eliminar un casillero con estado `Occupied` o socio activo asignado | `409` |
| **Casillero Inexistente** | El `id` recibido no existe en la base de datos | `404` |
| **Error de Permisos** | El usuario no posee rol administrativo | `403` |
| **Error de Infraestructura** | Falla la conexión con la base de datos | `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de Datos
Al no recibir body en la petición, la validación debe enfocarse en el parámetro de ruta. Se debe validar mediante un middleware o pipe (ej. `zod`) que el parámetro `{id}` tenga formato UUID válido antes de interactuar con la base de datos.

### 5.2. Consideraciones de Negocio
- Un casillero no puede eliminarse si su estado es `Occupied` o tiene un socio activo vinculado.
- Si el casillero está en estado `Maintenance`, se permite su eliminación asumiendo que la unidad física fue retirada del club.
- La eliminación libera inmediatamente el `number`, permitiendo su reutilización futura sin conflicto de unicidad.

### 5.3. Consideraciones de Seguridad
- El endpoint `DELETE /api/v1/lockers/{id}` es crítico y debe estar restringido exclusivamente a usuarios con rol administrativo. El sistema debe devolver `403 Forbidden` si un socio intenta ejecutarlo.

### 5.4. Posibles Mejoras Futuras
- **Registro de Auditoría de Bajas:** Implementar una tabla `locker_audit_logs` que registre automáticamente qué administrador ejecutó la eliminación, la fecha y hora exacta, y un campo de texto obligatorio con el motivo de la baja (ej. "Puerta rota sin arreglo", "Reemplazo por unidad más grande").

## 6. Componentes de Arquitectura Hexagonal

- **Domain:** Entidad `Locker` y reglas de negocio asociadas a la eliminación de casilleros: el casillero debe existir, no puede estar en estado `Occupied`, y solo puede eliminarse si no tiene socio asignado.

- **Application:** Caso de uso `DeleteLockerUseCase`, encargado de verificar la existencia del casillero, validar que su estado permita la eliminación y solicitar el borrado al repositorio.

- **Infrastructure:** Controlador HTTP para `DELETE /api/v1/lockers/{id}` y repositorio de casilleros implementado con Prisma.


## 7. Plan de Implementación

1. Definir el método `deleteById` en la interfaz `LockerRepository` del dominio.
2. Implementar `DeleteLockerUseCase` con la lógica de verificación de existencia y validación de estado.
3. Implementar `deleteById`.
4. Registrar la ruta `DELETE /api/v1/lockers/{id}` con validación `zod` del parámetro UUID y middleware de rol administrativo.
5. Conectar el handler con `DeleteLockerUseCase`.
6. Verificar el flujo completo con un cliente HTTP cubriendo escenarios de éxito y fallo (casillero ocupado, inexistente, sin permisos).

