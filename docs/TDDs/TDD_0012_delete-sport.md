| identificación | 12 |
|---------------|---|
| estado        | Propuesto |
| autor         | Esteban Trillo |
| fecha         | 2026-05-03 |
| título        | Eliminar un Deporte |

# TDD-0012: Eliminar un Deporte

## 1. Contexto de Negocio

### 1.1. Objetivo

Permitir a los administradores eliminar un deporte existente en el sistema del Club Alentapp, manteniendo actualizada la lista de disciplinas deportivas disponibles.

### 1.2. User Persona

- **Administrativo**: Este usuario es responsable de mantener actualizada la oferta deportiva del club. Al interactuar con esta funcionalidad, espera poder eliminar un deporte existente de forma controlada y con confirmacion previa. Solo usuarios con rol administrativo pueden realizar esta accion.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Eliminar Deporte
- **Como** administrativo, **quiero** eliminar un deporte, **para** mantener actualizada la lista de deportes que ofrece el club

- **Escenario de éxito**: si el administrativo quiere eliminar un deporte, el sistema debera solicitar una confirmacion de eliminacion y en caso afirmativo, eliminar dicho deporte
- **Escenario de fallo**: si un usuario sin permisos intenta eliminar un deporte, el sistema debera notificar que no tiene permisos para realizar dicha accion y redireccionarlo al inicio

### 1.4. Criterios de Aceptación Generales

- El sistema debe verificar que el deporte exista antes de proceder con la eliminacion.
- El sistema debe requerir confirmacion explicita antes de ejecutar la eliminacion.
- Al finalizar, el sistema no debe retornar contenido, respondiendo con un codigo `204 No Content`.
- Solo usuarios con rol administrativo pueden ejecutar esta operacion.

## 2. Diseño Técnico

### 2.1. Modelo de Dominio

Se definirá la entidad **Sport** con las siguientes propiedades y restricciones:

- **id**: identificador único universal (UUID) generado por el sistema
- **name**: cadena de texto. No puede ser modificado luego de su creación.
- **description**: cadena de texto editable.
- **max_capacity**: número entero. Debe ser mayor a cero.
- **additional_price**: número. Representa el costo adicional del deporte.
- **requires_medical_certificate**: booleano. Indica si se requiere certificado médico para participar.

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Eliminar Deporte
**Método:** `DELETE /api/v1/sports/:id`

**Response** (`204 No Content`):
```
Sin cuerpo de respuesta.
```

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

```typescript
export interface SportRepository {
  deleteById(id: string): Promise<void>;
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `Eliminar Deporte` (DeleteSport)

**Flujo paso a paso:**

1.
   - validar la existencia del deporte a eliminar a traves de su `id`

2.
   - solicitar confirmacion de eliminacion

3.
   - ejecutar la eliminacion del deporte a traves del repositorio via SportRepository.deleteById()

4.
   - confirmar la operacion retornando codigo 204 No Content

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Recurso Inexistente** | el `id` del deporte no existe en la base de datos. | `404` |
| **Sin Permisos** | el usuario no tiene permisos para eliminar el deporte. | `403` |
| **Error de Infraestructura** | falla la conexion con la base de datos. | `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se pueden utilizar librerias como `zod` para validar que el parametro `id` recibido tenga el formato UUID esperado antes de ejecutar la consulta al repositorio.

### 5.2. Consideraciones de negocio
- La eliminacion debe requerir confirmacion explicita por parte del administrativo antes de ejecutarse.

### 5.3. Consideraciones de seguridad
- Los endpoints de eliminacion deberían estar restringidos a usuarios con rol administrativo.

## 6. Componentes de Arquitectura Hexagonal

1. **Puerto:** `SportRepository` (Interface en el Dominio).
2. **Caso de Uso:** `DeleteSport` (Valida que el deporte exista antes de llamar al repositorio).
3. **Adaptador de Salida:** Implementación de persistencia en base de datos via Prisma.
4. **Adaptador de Entrada:** `SportController` (Ruta HTTP `DELETE /api/v1/sports/:id`).

## 7. Plan de Implementación

1. Verificar que el esquema `Sport` en Prisma ya contempla los campos necesarios.
2. Extender el puerto `SportRepository` con el método `deleteById` como interface en el Dominio.
3. Implementar el adaptador de salida `SportPrismaRepository` con el método `deleteById`.
4. Implementar el Caso de Uso `DeleteSport` con la validacion de existencia del deporte.
5. Actualizar el `SportController` con la ruta `DELETE /api/v1/sports/:id` y conectar con el Caso de Uso.
6. Conectar la accion de eliminacion en el frontend (React) con el endpoint del backend, incluyendo el dialogo de confirmacion.
