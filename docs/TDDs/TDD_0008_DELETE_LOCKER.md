| identifiacion | 08 |
|---------------|---|
| estado | Propuesto |
| autor | Brenda Belen Conti |
| fechas | 2026-05-02 |
| titulo | Baja de Locker |

# TDD-0008: Baja de Locker

## 1. Contexto de Negocio
### 1.1. Objetivo
Asegurar la correcta eliminación de casilleros en el sistema Alentapp, garantizando la integridad del modelo relacional al **impedir estrictamente el borrado de unidades que se encuentren actualmente ocupadas** por un socio.

### 1.2. User Personas

**Administrativo**: Este usuario es responsable de mantener el orden y la disponibilidad de la infraestructura del club. Al interactuar con esta funcionalidad, espera tener un control total e inmediato sobre el inventario de casilleros. Busca poder dar de baja aquellas unidades que se retiren.

#### Historia de Usuario 1: Baja de Locker (Eliminación)
**Como** administrador del club, **quiero** dar de baja y eliminar un casillero del sistema **para** mantener el inventario de la base de datos actualizado cuando una unidad física es retirada definitivamente de las instalaciones.

- **Escenario de éxito:** Al confirmar la eliminación de un casillero que no se encuentra en uso, el sistema lo borra exitosamente del modelo relacional y libera su número de identificación.  
- **Escenario de fallo:** Si se intenta eliminar un casillero que actualmente se encuentra ocupado por un socio (estado "Ocupado"), el sistema debe bloquear la operación por seguridad y mostrar un mensaje de error advirtiendo que no se puede eliminar un casillero en uso.

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

#### Endpoint: Baja de Locker
**Método**: `DELETE /api/v1/lockers/{id}`
**Request Body** `EmptyDto`:
```TypeScript
// No se requiere enviar un body. El ID del casillero a eliminar viaja como parámetro en la URL.
```

**Response** `(200 Ok)`:
```TypeScript
{
    message: string;          // ej. "Casillero eliminado correctamente"
    id: string;               // UUID del casillero que fue dado de baja
}
```

### 3.1. Definición del Puerto

```typescript
export interface LockerRepository {
  create(locker: Locker): Promise<Locker>;
  findById(id: string): Promise<Locker | null>;
  findByNumber(number: number): Promise<Locker | null>;
  findByStatus(status: string): Promise<Locker[]>;
  update(id: string, data: Partial<Omit<Locker, 'id' | 'number'>>): Promise<Locker>;
  deleteById(id: string)
}
```
### 3.2. Lógica del Caso de Uso
#### Caso de Uso: CU-01 Baja de Locker   

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

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Casillero en Uso** | no se puede eliminar un casillero que tenga un socio activo asignado (estado "Occupied"). | `409` |
| **Mantenimiento Ocupado** | no se puede eliminar un casillero que tenga un socio activo asignado. | `409` |
| **Error de Infraestructura** | falla la conexión con la base de datos.| `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
- Al no recibir un body en la petición, la validación debe enfocarse en los parámetros de ruta. Se debe validar mediante un middleware o pipe (ej. utilizando Zod) que el parámetro `{id}` recibido en la URL posea un formato UUID válido antes de intentar interactuar con la base de datos.

### 5.2. Consideraciones de negocio
- Un casillero bajo ninguna circunstancia puede ser eliminado si su estado actual es "Occupied" o si tiene un socio activo vinculado.
- Si el casillero se encuentra en estado "Maintenance", se permite su eliminación, asumiendo que la unidad física no tiene arreglo y fue retirada del club.
- La eliminación exitosa del registro libera inmediatamente su identificador numérico (`number`), permitiendo que ese número pueda ser reutilizado al dar de alta un nuevo locker en el futuro sin generar un conflicto de unicidad en la base de datos.

### 5.3. Consideraciones de seguridad
- El endpoint de eliminación (`DELETE /api/v1/lockers/{id}`) es crítico y debe estar restringido exclusivamente a usuarios que posean un rol administrativo. El sistema debe denegar la operación y devolver un `403 Forbidden` si un socio intenta ejecutarla.

### 5.4. Posibles mejoras futuras

- **Registro de Auditoría de Bajas:** Implementar una tabla de logs (`locker_audit_logs`) que registre de forma automática qué administrador (UUID) ejecutó la eliminación, la fecha y hora exacta, y exigir un campo de texto obligatorio detallando el "Motivo de la baja" (ej. "Puerta rota sin arreglo", "Reemplazo por unidad más grande").
