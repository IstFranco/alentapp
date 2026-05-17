| identificación | 11 |
|---------------|---|
| estado        | Propuesto |
| autor         | Esteban Trillo |
| fecha         | 2026-05-03 |
| título        | Modificacion de un Deporte |

# TDD-0011: Modificacion de un Deporte

## 1. Contexto de Negocio

### 1.1. Objetivo

Permitir a los administradores modificar la informacion de un deporte existente en el sistema del Club Alentapp, actualizando su descripcion y/o cupo maximo para mantener la oferta deportiva actualizada.

### 1.2. User Persona

- **Administrativo**: Este usuario es responsable de mantener actualizada la oferta deportiva del club. Al interactuar con esta funcionalidad, espera poder modificar la descripcion y/o el cupo maximo de un deporte existente de forma rapida y sin errores. Busca actualizar los datos sin poder alterar el nombre del deporte ni ingresar valores invalidos.

### 1.3. Criterios de Aceptación (User Stories)

#### Historia de Usuario 1: Editar Deporte
- **Como** administrativo, **quiero** modificar la descripcion y/o el cupo maximo de un deporte, **para** mantener actualizada la lista de deportes que ofrece el club

- **Escenario de éxito**: si el administrativo ingresa una nueva descripcion y/o un cupo maximo mayor a cero, el sistema debera actualizar el o los campos modificados y notificar como actualizacion exitosa
- **Escenario de fallo**: si el administrativo intenta cambiar el nombre de un deporte, el sistema debera ignorar el cambio y notificar que no es posible realizar dicha actualizacion

### 1.4. Criterios de Aceptación Generales

- El sistema debe ignorar el campo `name` si es enviado en el cuerpo de la solicitud, ya que es inmutable luego de su creación.
- El sistema debe validar que `max_capacity` sea un número entero mayor a cero.
- Al finalizar, el sistema debe retornar los datos actualizados del deporte con un código `200 OK`.
- El deporte debe existir en el sistema; de lo contrario, se debe retornar un error `404`.

## 2. Diseño Técnico

### 2.1. Modelo de Dominio

Se definirá la entidad **Sport** con las siguientes propiedades y restricciones:

- **id**: identificador único universal (UUID) generado por el sistema
- **name**: cadena de texto. No puede ser modificado luego de su creación
- **description**: cadena de texto editable.
- **max_capacity**: número entero. Debe ser mayor a cero.
- **additional_price**: número. Representa el costo adicional del deporte.
- **requires_medical_certificate**: booleano. Indica si se requiere certificado médico para participar.

### 2.2. Contrato de API (Shared DTOs)

#### Endpoint: Actualizar Deporte
**Método:** `PATCH /api/v1/sports/:id`

**Request Body** (`UpdateSportDto`):
```typescript
{
  description?: string;                      // editable
  max_capacity?: number;                     // editable y debe ser mayor a cero
}
```

**Response** (`200 OK`):
```typescript
{
    id: string;
    name: string;                              // inmutable luego de la creacion
    description: string;                       // editable
    max_capacity: number;                      // debe ser mayor a cero
    additional_price: number;
    requires_medical_certificate: boolean;
}
```

## 3. Arquitectura y Flujo

### 3.1. Definición del Puerto

```typescript
export interface SportRepository {
  update(id: string, data: Partial<Omit<Sport, 'id' | 'name'>>): Promise<Sport>;
}
```

### 3.2. Lógica del Caso de Uso

**Caso de Uso:** `Actualizar Deporte` (UpdateSport)

**Flujo paso a paso:**

1.
   - validar la existencia del deporte a modificar
   - validar que solo se reciban los datos `max_capacity` y/o `description`, ignorar el resto

2.
   - validar que `max_capacity` sea mayor a cero

3.
   - mapear los datos del DTO recibido en la entidad asociada al deporte que se espera modificar

4.
   - persistir el mapeo de dichos datos, a traves de SportRepository.update()

5.
   - retornar SportResponseDto mapeado desde la entidad persistida actualizada con codigo 200 OK

## 4. Casos de Borde y Manejo de Errores

| Escenario de Error | Validación / Regla de Negocio | Código HTTP |
|-------------------|-------------------------------|-------------|
| **Recurso Inexistente** | el `id` del deporte no existe en la base de datos. | `404` |
| **Modificacion Invalida** | no se permite modificar el campo `name` una vez creado el deporte. | `400` |
| **Cupo Invalido** | el campo `max_capacity` debe ser mayor a cero. | `400` |
| **Error de Infraestructura** | falla la conexion con la base de datos. | `500` |

## 5. Observaciones Adicionales

### 5.1. Validaciones de datos
Se pueden utilizar librerías como `zod` para validar los datos de entrada en los DTOs, asegurando que solo se reciban los campos permitidos y que `max_capacity` sea mayor a cero.

### 5.2. Consideraciones de negocio
- El campo `name` no debe poder modificarse una vez creado el deporte.
- No se debe permitir reducir el `max_capacity` por debajo de la cantidad de inscriptos actuales.

### 5.3. Consideraciones de seguridad
- Los endpoints de modificación deberían estar restringidos a usuarios con rol administrativo.

## 6. Componentes de Arquitectura Hexagonal

1. **Puerto:** `SportRepository` (Interface en el Dominio).
2. **Caso de Uso:** `UpdateSport` (Valida que el deporte exista, que `max_capacity` sea mayor a cero y que no sea menor a los inscriptos actuales antes de llamar al repositorio).
3. **Adaptador de Salida:** Implementación de persistencia en base de datos via Prisma.
4. **Adaptador de Entrada:** `SportController` (Ruta HTTP `PATCH /api/v1/sports/:id`).

## 7. Plan de Implementación

1. Verificar que el esquema `Sport` en Prisma ya contempla los campos necesarios; correr migración si corresponde.
2. Crear los tipos y DTOs compartidos (`UpdateSportDto`) en el paquete `@alentapp/shared`.
3. Extender el puerto `SportRepository` con el método `update` como interface en el Dominio.
4. Implementar el adaptador de salida `SportPrismaRepository` con el método `update`.
5. Implementar el Caso de Uso `UpdateSport` con las validaciones de negocio (existencia del deporte, cupo > 0, cupo >= inscriptos actuales, name inmutable).
6. Actualizar el `SportController` con la ruta `PATCH /api/v1/sports/:id` y conectar con el Caso de Uso.
7. Conectar el formulario de edición en el frontend (React) con el endpoint del backend.
